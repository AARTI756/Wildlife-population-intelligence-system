import os
import sys
import numpy as np
import soundfile as sf

# Add backend folder to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.yamnet_service import yamnet_service

def generate_sample_wavs():
    os.makedirs("tests/test_calls", exist_ok=True)
    sr = 16000
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    
    # 1. High frequency sine wave (bird-like tone)
    # 2500 Hz frequency
    bird_wave = np.sin(2 * np.pi * 2500 * t) * 0.4
    bird_path = "tests/test_calls/sample_bird.wav"
    sf.write(bird_path, bird_wave.astype(np.float32), sr)
    print(f"Generated bird-like sample at {bird_path}")
    
    # 2. Low frequency amplitude-modulated sine wave (mammal-like growl/bark tone)
    # 150 Hz frequency, modulated
    mammal_wave = np.sin(2 * np.pi * 150 * t) * 0.5 * (1 + np.sin(2 * np.pi * 5 * t)) * 0.5
    # Add minor noise
    mammal_wave += np.random.randn(len(t)) * 0.05
    mammal_path = "tests/test_calls/sample_mammal.wav"
    sf.write(mammal_path, mammal_wave.astype(np.float32), sr)
    print(f"Generated mammal-like sample at {mammal_path}")
    
    # 3. Random noise / white noise (environmental noise)
    noise_wave = np.random.randn(len(t)) * 0.1
    noise_path = "tests/test_calls/sample_noise.wav"
    sf.write(noise_path, noise_wave.astype(np.float32), sr)
    print(f"Generated noise sample at {noise_path}")

def run_yamnet_inference():
    print("\nRunning YAMNet service verification:")
    yamnet_service.initialize()
    print(f"YAMNet service initialized: {yamnet_service.interpreter is not None}")
    
    samples = [
        ("Bird Sample", "tests/test_calls/sample_bird.wav"),
        ("Mammal Sample", "tests/test_calls/sample_mammal.wav"),
        ("Noise Sample", "tests/test_calls/sample_noise.wav")
    ]
    
    for name, path in samples:
        print(f"\nRunning inference on {path}...")
        res = yamnet_service.run_inference(path)
        print(f"Inference result: {res}")
        
    print("\nVerification Completed Successfully!")

if __name__ == "__main__":
    generate_sample_wavs()
    run_yamnet_inference()
