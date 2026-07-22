import os
import time
import logging
import cv2
from typing import List, Dict, Any
from ultralytics import YOLO

# Setup logging
logger = logging.getLogger("yolo_service")
logger.setLevel(logging.INFO)

class YOLOService:
    _instance = None
    _model = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(YOLOService, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def initialize(self, model_path: str = "backend/models/best.pt"):
        if self._model is None:
            # Resolve relative model_path dynamically relative to this file
            service_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(os.path.dirname(service_dir))
            abs_model_path = os.path.join(backend_dir, "models", "best.pt")
            
            print(f"YOLO DEBUG - Resolving model path: {abs_model_path}")
            if not os.path.exists(abs_model_path):
                print(f"YOLO DEBUG - Error: Model path does not exist!")
                raise FileNotFoundError(f"YOLO Model weight file not found at {abs_model_path}")
                
            model_path = abs_model_path
            
            logger.info(f"Loading YOLOv11 model from {model_path}...")
            print(f"YOLO DEBUG - Loading YOLOv11 model from {model_path}...")
            start_time = time.time()
            self._model = YOLO(model_path)
            load_elapsed = time.time() - start_time
            logger.info(f"YOLOv11 model loaded successfully in {load_elapsed:.2f}s")
            
            # Print model specs (DEBUG INFO)
            print("==================================================")
            print("YOLO DEBUG - MODEL LOAD DETAILS:")
            print(f"  Model Path: {model_path}")
            print(f"  Model Type: {type(self._model)}")
            print(f"  Class Count: {len(self._model.names)}")
            print(f"  Class Names: {self._model.names}")
            print("==================================================")

    def run_inference(self, image_path: str, conf_threshold: float = 0.10) -> List[Dict[str, Any]]:
        self.initialize()
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found for inference: {image_path}")

        # Log image details and preprocessing
        try:
            img = cv2.imread(image_path)
            h_raw, w_raw, c_raw = img.shape
            raw_size = f"{w_raw}x{h_raw}x{c_raw}"
        except Exception as e:
            raw_size = "unknown"
            
        print("==================================================")
        print("YOLO DEBUG - INFERENCE RUN:")
        print(f"  Image Path: {image_path}")
        print(f"  Raw Image Size: {raw_size}")
        print(f"  Preprocessing Dimensions: 640x640")
        print("==================================================")

        start_time = time.time()
        
        # Run inference with very low confidence (0.01) to get raw detections for logging
        results = self._model(image_path, conf=0.01, verbose=False)
        
        inference_time = (time.time() - start_time) * 1000  # in ms
        
        raw_detections = []
        if len(results) > 0:
            result = results[0]
            print(f"YOLO DEBUG - Raw Detections count (before filter): {len(result.boxes)}")
            
            for idx, box in enumerate(result.boxes):
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                species = self._model.names[class_id]
                
                # Get coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                print(f"  [Raw Detection #{idx}] Class ID: {class_id}, Name: {species}, Confidence: {confidence:.4f}, Box: [{x1:.1f}, {y1:.1f}, {x2:.1f}, {y2:.1f}]")
                
                raw_detections.append({
                    "species": species,
                    "confidence": confidence,
                    "class_id": class_id,
                    "bounding_box": {
                        "x1": round(x1),
                        "y1": round(y1),
                        "x2": round(x2),
                        "y2": round(y2)
                    }
                })
        
        # Filter detections based on conf_threshold
        filtered_detections = [
            d for d in raw_detections 
            if d["confidence"] >= conf_threshold
        ]
        
        print(f"YOLO DEBUG - Filtered Detections (threshold={conf_threshold}): {len(filtered_detections)} / {len(raw_detections)}")
        print("==================================================")
        
        # Draw annotations directly from raw output before database lookup
        if len(filtered_detections) > 0:
            self.draw_annotations(image_path, filtered_detections)
            
        return filtered_detections

    def draw_annotations(self, image_path: str, detections: List[Dict[str, Any]]):
        if not detections:
            return

        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Failed to read image for drawing annotations: {image_path}")
            return
            
        for det in detections:
            bbox = det["bounding_box"]
            x1, y1, x2, y2 = int(bbox["x1"]), int(bbox["y1"]), int(bbox["x2"]), int(bbox["y2"])
            label = f"{det['species']} {int(det['confidence'] * 100)}%"
            
            # Draw bounding box (emerald green color: BGR format is 16, 185, 129 -> BGR: 129, 185, 16)
            cv2.rectangle(image, (x1, y1), (x2, y2), (129, 185, 16), 2)
            
            # Bounding box label size
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            
            # Ensure label text doesn't overflow top boundary
            label_y = max(y1, 20)
            cv2.rectangle(image, (x1, label_y - 18), (x1 + w + 4, label_y + 2), (129, 185, 16), -1)
            cv2.putText(image, label, (x1 + 2, label_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
            
        cv2.imwrite(image_path, image)
        logger.info(f"Annotated image saved at: {image_path}")

# Initialize singleton instance
yolo_service = YOLOService()
