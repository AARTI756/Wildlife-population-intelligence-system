import os
import sys
import numpy as np
import librosa

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.yamnet_service import yamnet_service

def verify_yamnet_service():
    print("Initializing YAMNet service...")
    try:
        yamnet_service.initialize()
        print(f"YAMNet service initialized: {yamnet_service.interpreter is not None}")
    except Exception as e:
        print(f"Failed to initialize YAMNet: {e}")
        return
        
    # Generate a dummy waveform representing a bark/low frequency sound (a simple sine wave + some noise)
    sr = 16000
    duration = 2.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # 200 Hz sine wave + random noise
    waveform = np.sin(2 * np.pi * 200 * t) * 0.5 + np.random.randn(len(t)) * 0.1
    waveform = waveform.astype(np.float32)
    
    # Save dummy wav file
    dummy_path = "tests/dummy_bark.wav"
    os.makedirs(os.path.dirname(dummy_path), exist_ok=True)
    
    import soundfile as sf
    sf.write(dummy_path, waveform, sr)
    print(f"Dummy wav written to {dummy_path}")
    
    # Run YAMNet inference on dummy wave
    print("Running inference...")
    res = yamnet_service.run_inference(dummy_path)
    print(f"Inference result: {res}")
    
    # Clean up
    if os.path.exists(dummy_path):
        os.remove(dummy_path)
        
    # Test class mapping directly
    test_cases = [
        ("Frog", "Amphibian Call", 127),
        ("Cricket", "Insect Sound", 121),
        ("Mosquito", "Insect Sound", 125),
        ("Dog", "Mammal Vocalization", 69),
        ("Bark", "Mammal Vocalization", 70),
        ("Cat", "Mammal Vocalization", 76),
        ("Lion", "Mammal Vocalization", 104),
        ("Animal", "Generic Animal Vocalization", 67),
        ("Bird", "Generic Animal Vocalization", 106),
        ("Speech", "Environmental Noise", 0),
        ("Wind", "Environmental Noise", 500)
    ]
    
    print("\nVerifying direct category mapping rules:")
    success = True
    for name, expected_cat, idx in test_cases:
        mapped = yamnet_service.map_class_to_category(name, idx)
        status = "PASS" if mapped == expected_cat else "FAIL"
        print(f"Class: {name:<10} | Mapped: {mapped:<30} | Expected: {expected_cat:<30} -> {status}")
        if mapped != expected_cat:
            success = False
            
    if success:
        print("\nAll category mapping rules verified successfully!")
    else:
        print("\nSome mapping rules failed!")

if __name__ == "__main__":
    verify_yamnet_service()
