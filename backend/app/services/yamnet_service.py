import os
import csv
import logging
import numpy as np
import librosa
import tensorflow as tf

logger = logging.getLogger(__name__)

class YAMNetService:
    def __init__(self):
        # Resolve paths dynamically relative to this file
        service_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(os.path.dirname(service_dir))
        
        self.model_path = os.path.join(backend_dir, "models", "yamnet.tflite")
        self.class_map_path = os.path.join(backend_dir, "models", "yamnet_class_map.csv")
        self.interpreter = None
        self.class_names = {}
        self._load_class_map()

    def _load_class_map(self):
        if not os.path.exists(self.class_map_path):
            logger.warning(f"YAMNet class map CSV not found at {self.class_map_path}")
            return
        try:
            with open(self.class_map_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    idx = int(row["index"])
                    display_name = row["display_name"]
                    self.class_names[idx] = display_name
        except Exception as e:
            logger.error(f"Error loading YAMNet class map CSV: {e}")

    def initialize(self):
        if self.interpreter is None:
            if not os.path.exists(self.model_path):
                logger.error(f"YAMNet model not found at {self.model_path}")
                raise FileNotFoundError(f"YAMNet model not found at {self.model_path}")
            try:
                # Load TFLite interpreter
                self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
                self.interpreter.allocate_tensors()
                logger.info("YAMNet TFLite interpreter loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load YAMNet TFLite interpreter: {e}")
                raise

    def run_inference(self, filepath: str) -> dict:
        """Run YAMNet inference on audio file and map classes into WPIS categories."""
        try:
            self.initialize()
        except Exception as e:
            return {
                "animal_call_detected": False,
                "animal_call_category": "Environmental Noise",
                "details": f"Failed to initialize YAMNet: {e}"
            }
            
        # Load audio at 16kHz mono (YAMNet requirement)
        try:
            waveform, sr = librosa.load(filepath, sr=16000, mono=True)
        except Exception as e:
            logger.error(f"YAMNet failed to load audio file: {e}")
            return {
                "animal_call_detected": False,
                "animal_call_category": "Environmental Noise",
                "details": f"Failed to load audio: {e}"
            }
            
        if len(waveform) == 0:
            return {
                "animal_call_detected": False,
                "animal_call_category": "Environmental Noise",
                "details": "Audio waveform is empty"
            }
            
        try:
            # Get input and output tensors
            input_details = self.interpreter.get_input_details()
            output_details = self.interpreter.get_output_details()
            
            waveform_input_index = input_details[0]['index']
            scores_output_index = output_details[0]['index']
            
            # Ensure format is float32
            waveform = waveform.astype(np.float32)
            
            # Resize input tensor according to input audio length
            self.interpreter.resize_tensor_input(waveform_input_index, [len(waveform)])
            self.interpreter.allocate_tensors()
            
            self.interpreter.set_tensor(waveform_input_index, waveform)
            self.interpreter.invoke()
            
            # Output scores shape: [num_frames, 521]
            scores = self.interpreter.get_tensor(scores_output_index)
            
            # Mean scores over all frames
            mean_scores = np.mean(scores, axis=0)
            
            # Find top class
            top_idx = int(np.argmax(mean_scores))
            top_score = float(mean_scores[top_idx])
            top_class_name = self.class_names.get(top_idx, f"Class {top_idx}")
            
            # Map class to category
            category = self.map_class_to_category(top_class_name, top_idx)
            
            # Only consider it an animal call if it maps to an animal category
            # AND the score is above a reasonable threshold (e.g. 0.15)
            animal_detected = False
            if category in ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"]:
                if top_score >= 0.15:
                    animal_detected = True
                else:
                    category = "Environmental Noise"
                    
            logger.info(f"YAMNet completed: detected={animal_detected}, category={category}, top_class={top_class_name} ({top_score:.2f})")
            return {
                "animal_call_detected": animal_detected,
                "animal_call_category": category,
                "primary_class": top_class_name,
                "confidence": top_score
            }
            
        except Exception as e:
            logger.exception("YAMNet inference failed")
            return {
                "animal_call_detected": False,
                "animal_call_category": "Environmental Noise",
                "details": f"YAMNet inference error: {e}"
            }

    def map_class_to_category(self, class_name: str, class_idx: int) -> str:
        name_lower = class_name.lower()
        
        # 1. Amphibian Call
        if "frog" in name_lower or "toad" in name_lower or "croak" in name_lower or class_idx == 127:
            return "Amphibian Call"
            
        # 2. Insect Sound
        insect_keywords = ["insect", "cricket", "mosquito", "fly", "bee", "wasp", "buzz", "cicada"]
        if class_idx == 121 or any(kw in name_lower for kw in insect_keywords):
            return "Insect Sound"
            
        # 3. Mammal Vocalization
        mammal_keywords = [
            "dog", "bark", "howl", "growling", "whimper", "canidae", "wolf", "coyote",
            "cat", "meow", "purr", "caterwaul", "feline",
            "lion", "tiger", "cheetah", "leopard", "cougar", "panther",
            "pig", "oink", "grunt", "boar",
            "sheep", "goat", "bleat", "ram",
            "horse", "neigh", "whinny", "snort", "equine",
            "cattle", "cow", "moo", "lowing", "bovine", "gaur", "bison",
            "monkey", "chimpanzee", "gorilla", "baboon", "macaque", "primate", "gibbon",
            "elephant",
            "mouse", "rat", "rodent", "hamster", "guinea pig",
            "bat",
            "bear",
            "deer", "elk", "moose",
            "hippopotamus",
            "rhinoceros",
            "camel",
            "fox",
            "raccoon",
            "squirrel",
            "mammal",
            "howler monkey", "squirrel monkey"
        ]
        
        if class_idx in range(69, 81) or class_idx in range(81, 100) or class_idx == 104 or class_idx == 117:
            return "Mammal Vocalization"
            
        if any(kw in name_lower for kw in mammal_keywords):
            return "Mammal Vocalization"
            
        # 4. Generic Animal Vocalization
        generic_keywords = [
            "animal", "pet", "livestock", "roar", "growl", "wildlife", "bird", "chirp", "tweet", "cluck", "crowing", "quack"
        ]
        if class_idx in [67, 68, 103, 105, 106, 107, 108] or any(kw in name_lower for kw in generic_keywords):
            return "Generic Animal Vocalization"
            
        # 5. Environmental Noise
        return "Environmental Noise"

yamnet_service = YAMNetService()
