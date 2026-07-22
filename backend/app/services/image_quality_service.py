import cv2
import numpy as np

def assess_image_quality(path, inference_confidence=None):
    image = cv2.imread(path)
    if image is None:
        raise ValueError("OpenCV could not decode image")
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    dark_or_bright = float(np.mean((gray < 20) | (gray > 235)))
    # Low edge density is reported as possible occlusion/low-detail, not certainty.
    edge_density = float(np.mean(cv2.Canny(gray, 80, 160) > 0))
    exposure = "Underexposed" if brightness < 65 else "Overexposed" if brightness > 195 else "Balanced"
    blur = "High" if sharpness < 40 else "Moderate" if sharpness < 110 else "Low"
    score = min(100, max(0, round((min(contrast, 70) / 70 * 30) + (min(sharpness, 180) / 180 * 35) + (30 if exposure == "Balanced" else 15) + (5 if width * height >= 1280 * 720 else 0))))
    quality = "High" if score >= 75 else "Medium" if score >= 50 else "Low"
    return {
        "image_quality": quality, "overall_score": score, "brightness": round(brightness, 1),
        "contrast": round(contrast, 1), "blur": blur, "sharpness": round(sharpness, 1),
        "resolution": {"width": width, "height": height}, "exposure": exposure,
        "occlusion_estimate": "Possible" if edge_density < 0.015 else "Low evidence",
        "inference_confidence_impact": round(float(inference_confidence or 0) * 100, 1),
    }
