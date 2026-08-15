import os
import shutil
import uuid
import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.monitoring import Survey, MonitoringSite, CameraTrap, AudioSensor
from app.models.upload import UploadedImage, UploadedAudio
from app.models.observation import Observation

# Paths
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(APP_DIR, ".."))
SAMPLE_DATA_DIR = os.path.join(WORKSPACE_ROOT, "sample_data")
UPLOAD_DIR = os.path.join(APP_DIR, "uploads")
IMAGES_DIR = os.path.join(UPLOAD_DIR, "images")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")

# Lists
SITES_DATA = [
    {"name": "Tadoba Core Zone", "location": "Tadoba-Andhari Tiger Reserve, Chandrapur, Maharashtra", "latitude": 20.2154, "longitude": 79.3045, "protected_area": True, "description": "High density tiger breeding zone with deciduous forest cover."},
    {"name": "Pench Riverside Zone", "location": "Pench Tiger Reserve, Nagpur, Maharashtra/MP", "latitude": 21.6489, "longitude": 79.2155, "protected_area": True, "description": "Teak forest corridor along the Pench River."},
    {"name": "Kanha Meadow Circle", "location": "Kanha National Park, Mandla, Madhya Pradesh", "latitude": 22.3312, "longitude": 80.6115, "protected_area": True, "description": "Sal forests and meadows supporting Barasingha populations."},
    {"name": "Bandipur Moyar Gorge", "location": "Bandipur National Park, Chamarajanagar, Karnataka", "latitude": 11.6664, "longitude": 76.6281, "protected_area": True, "description": "Dry deciduous scrubland bordering the Moyar River canyon."},
    {"name": "Nagarhole Kabini Riverbank", "location": "Nagarhole National Park, Kodagu, Karnataka", "latitude": 11.9723, "longitude": 76.2711, "protected_area": True, "description": "Moist deciduous forest along the Kabini reservoir."},
    {"name": "Corbett Dhikala Zone", "location": "Jim Corbett National Park, Nainital, Uttarakhand", "latitude": 29.5312, "longitude": 78.7745, "protected_area": True, "description": "Large grasslands (Chaurs) and river valley habitat."},
    {"name": "Kaziranga Kohora Range", "location": "Kaziranga National Park, Golaghat, Assam", "latitude": 26.5821, "longitude": 93.3892, "protected_area": True, "description": "Tall elephant grass plains and wetlands."},
    {"name": "Gir Sasan Sanctuary", "location": "Gir National Park, Junagadh, Gujarat", "latitude": 21.1244, "longitude": 70.8248, "protected_area": True, "description": "Dry deciduous scrub forest, final refuge of Asiatic Lion."},
    {"name": "Satpura Madhai Range", "location": "Satpura Tiger Reserve, Hoshangabad, Madhya Pradesh", "latitude": 22.4554, "longitude": 77.9818, "protected_area": True, "description": "Rugged terrain with deep gorges, sal, and teak forests."},
    {"name": "Ranthambore Zone 3", "location": "Ranthambore National Park, Sawai Madhopur, Rajasthan", "latitude": 25.9922, "longitude": 76.4351, "protected_area": True, "description": "Dry deciduous forest surrounding historic lakes."},
    {"name": "Periyar Thekkady Lake", "location": "Periyar Tiger Reserve, Idukki, Kerala", "latitude": 9.5162, "longitude": 77.1643, "protected_area": True, "description": "Evergreen forest surrounding the reservoir, elephant territory."},
    {"name": "Sundarbans Sajnekhali Range", "location": "Sundarbans National Park, South 24 Parganas, West Bengal", "latitude": 22.1154, "longitude": 88.7912, "protected_area": True, "description": "Mangrove swamp habitat with tidal creeks."},
    {"name": "Mudumalai Kargudi Area", "location": "Mudumalai National Park, Nilgiris, Tamil Nadu", "latitude": 11.5791, "longitude": 76.6212, "protected_area": True, "description": "Deciduous forest and elephant migration corridor."},
    {"name": "Eravikulam Rajamala", "location": "Eravikulam National Park, Idukki, Kerala", "latitude": 10.1982, "longitude": 77.0864, "protected_area": True, "description": "High altitude shola grasslands, home of Nilgiri Tahr."},
    {"name": "Keoladeo Wetland Zone", "location": "Keoladeo National Park, Bharatpur, Rajasthan", "latitude": 27.1611, "longitude": 77.5182, "protected_area": True, "description": "Man-made wetland, world heritage bird nesting site."},
    {"name": "Silent Valley Sairandhri", "location": "Silent Valley National Park, Palakkad, Kerala", "latitude": 11.1031, "longitude": 76.4342, "protected_area": True, "description": "Tropical rainforest with unique evolutionary lineage flora/fauna."},
    {"name": "Manas Bansbari Range", "location": "Manas National Park, Chirang, Assam", "latitude": 26.7321, "longitude": 90.9631, "protected_area": True, "description": "Bhabar grasslands and semi-evergreen forests."},
    {"name": "Valley of Flowers", "location": "Valley of Flowers National Park, Chamoli, Uttarakhand", "latitude": 30.7282, "longitude": 79.6051, "protected_area": True, "description": "Alpine meadows with endemic alpine flora."},
    {"name": "Hemis High Altitude", "location": "Hemis National Park, Leh, Ladakh", "latitude": 33.9161, "longitude": 77.5632, "protected_area": True, "description": "Cold desert high-altitude valley, snow leopard territory."},
    {"name": "Dachigam Harwan", "location": "Dachigam National Park, Srinagar, Jammu & Kashmir", "latitude": 34.1374, "longitude": 74.9381, "protected_area": True, "description": "Coniferous forest, home of the endangered Hangul deer."},
    {"name": "Similipal Baripada", "location": "Similipal Tiger Reserve, Mayurbhanj, Odisha", "latitude": 21.9312, "longitude": 86.3211, "protected_area": True, "description": "Sal forests and grassy meadows in eastern Ghats."},
    {"name": "Panna Hinouta Zone", "location": "Panna National Park, Panna, Madhya Pradesh", "latitude": 24.7181, "longitude": 80.0211, "protected_area": True, "description": "Dry deciduous forest and gorges of the Ken River."}
]

SURVEYS_DATA = [
    {"name": "Tiger Density Survey 2026", "habitat_type": "Deciduous Forest", "monitoring_device": "Camera Trap"},
    {"name": "Large Carnivore Assessment 2026", "habitat_type": "Dry Deciduous Forest", "monitoring_device": "Camera Trap"},
    {"name": "Predator-Prey Interaction Study", "habitat_type": "Meadow/Grassland", "monitoring_device": "Camera Trap"},
    {"name": "Elephant Corridor Survey 2026", "habitat_type": "Mixed Deciduous Forest", "monitoring_device": "Visual"},
    {"name": "Ungulate Census 2026", "habitat_type": "Riverine Wetland", "monitoring_device": "Camera Trap"},
    {"name": "Grassland Biodiversity Audit", "habitat_type": "Terai Grassland", "monitoring_device": "Visual"},
    {"name": "Grassland Mammal Surveillance", "habitat_type": "Tall Grasslands", "monitoring_device": "Camera Trap"},
    {"name": "Asiatic Lion Registry 2026", "habitat_type": "Dry Scrub Forest", "monitoring_device": "Camera Trap"},
    {"name": "Canopy & Soil Bioacoustics", "habitat_type": "Rugged Deciduous", "monitoring_device": "Audio Sensor"},
    {"name": "Dry Deciduous Wildlife Survey", "habitat_type": "Arid Deciduous", "monitoring_device": "Camera Trap"},
    {"name": "Western Ghats Monsoon Census", "habitat_type": "Tropical Evergreen", "monitoring_device": "Visual"},
    {"name": "Mangrove Wildlife Survey", "habitat_type": "Mangrove Swamp", "monitoring_device": "Camera Trap"},
    {"name": "Nilgiri Biosphere Monitoring", "habitat_type": "Moist Deciduous", "monitoring_device": "Audio Sensor"},
    {"name": "High Altitude Tahr Census", "habitat_type": "Shola Grasslands", "monitoring_device": "Visual"},
    {"name": "Wetland Aviary Survey 2026", "habitat_type": "Freshwater Wetland", "monitoring_device": "Audio Sensor"},
    {"name": "Silent Valley Bioacoustic Audit", "habitat_type": "Tropical Rainforest", "monitoring_device": "Audio Sensor"},
    {"name": "Foothill Species Diversity", "habitat_type": "Semi-Evergreen Forest", "monitoring_device": "Camera Trap"},
    {"name": "Alpine Flora & Fauna Survey", "habitat_type": "Alpine Meadow", "monitoring_device": "Visual"},
    {"name": "Snow Leopard Prey Monitoring", "habitat_type": "High Altitude Cold Desert", "monitoring_device": "Camera Trap"},
    {"name": "Hangul Deer Population Survey", "habitat_type": "Coniferous Forest", "monitoring_device": "Visual"}
]

SPECIES_LOCATIONS = {
    "Bengal Tiger": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Corbett Dhikala Zone", "Bandipur Moyar Gorge"],
    "Indian Leopard": ["Corbett Dhikala Zone", "Ranthambore Zone 3", "Gir Sasan Sanctuary", "Kanha Meadow Circle", "Bandipur Moyar Gorge"],
    "Asiatic Lion": ["Gir Sasan Sanctuary"],
    "One-horned Rhinoceros": ["Kaziranga Kohora Range"],
    "Asian Elephant": ["Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Kaziranga Kohora Range"],
    "Sloth Bear": ["Tadoba Core Zone", "Gir Sasan Sanctuary", "Satpura Madhai Range"],
    "Indian Gaur": ["Tadoba Core Zone", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Kanha Meadow Circle"],
    "Sambar Deer": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Corbett Dhikala Zone", "Ranthambore Zone 3"],
    "Chital": ["Corbett Dhikala Zone", "Ranthambore Zone 3", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank"],
    "Nilgai": ["Ranthambore Zone 3", "Pench Riverside Zone", "Gir Sasan Sanctuary"],
    "Wild Boar": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Corbett Dhikala Zone", "Kaziranga Kohora Range", "Gir Sasan Sanctuary", "Satpura Madhai Range", "Ranthambore Zone 3"],
    "Dhole": ["Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Pench Riverside Zone", "Kanha Meadow Circle"],
    "Indian Peafowl": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Corbett Dhikala Zone", "Gir Sasan Sanctuary", "Satpura Madhai Range", "Ranthambore Zone 3"],
    "Indian Python": ["Tadoba Core Zone", "Corbett Dhikala Zone", "Kaziranga Kohora Range", "Sundarbans Sajnekhali Range"]
}

BIRD_LOCATIONS = {
    "Indian Peafowl": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Corbett Dhikala Zone", "Gir Sasan Sanctuary", "Satpura Madhai Range", "Ranthambore Zone 3"],
    "Asian Koel": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Keoladeo Wetland Zone", "Gir Sasan Sanctuary"],
    "Jungle Babbler": ["Tadoba Core Zone", "Pench Riverside Zone", "Kanha Meadow Circle", "Bandipur Moyar Gorge", "Nagarhole Kabini Riverbank", "Gir Sasan Sanctuary"],
    "Indian Pitta": ["Silent Valley Sairandhri", "Mudumalai Kargudi Area", "Eravikulam Rajamala", "Nagarhole Kabini Riverbank"],
    "Hornbill": ["Silent Valley Sairandhri", "Nagarhole Kabini Riverbank", "Mudumalai Kargudi Area", "Manas Bansbari Range"],
    "Owl": ["Tadoba Core Zone", "Pench Riverside Zone", "Corbett Dhikala Zone", "Hemis High Altitude", "Silent Valley Sairandhri"]
}

def create_sample_folders():
    image_species = [
        "Bengal_Tiger", "Indian_Leopard", "Asiatic_Lion", "Asian_Elephant",
        "Sloth_Bear", "Indian_Gaur", "Chital", "Sambar_Deer", "Nilgai",
        "Wild_Boar", "Dhole", "Indian_Peafowl"
    ]
    audio_species = [
        "Indian_Peafowl", "Asian_Koel", "Jungle_Babbler", "Indian_Pitta",
        "Hornbill", "Owl"
    ]
    
    os.makedirs(os.path.join(SAMPLE_DATA_DIR, "images"), exist_ok=True)
    os.makedirs(os.path.join(SAMPLE_DATA_DIR, "audio"), exist_ok=True)
    
    for sp in image_species:
        os.makedirs(os.path.join(SAMPLE_DATA_DIR, "images", sp), exist_ok=True)
    for sp in audio_species:
        os.makedirs(os.path.join(SAMPLE_DATA_DIR, "audio", sp), exist_ok=True)
    
    # Write a quick explanation file
    with open(os.path.join(SAMPLE_DATA_DIR, "README.md"), "w") as f:
        f.write("# WPIS Demo Dataset Assets\nDrop your Indian wildlife camera trap images or audio logs in the respective subfolders. If empty, the demo generator will register metadata records in the DB pointing to virtual assets so the dashboard and map work.\n")

def seed_demo_data(db: Session, current_user_id: int):
    # Ensure sample folders structure exists
    create_sample_folders()
    
    # 1. Seed Sites (Target: 22 total)
    current_sites_count = db.query(MonitoringSite).count()
    sites_needed = max(0, 22 - current_sites_count)
    
    existing_sites = {s.name: s for s in db.query(MonitoringSite).all()}
    sites_created = 0
    
    site_instances = list(existing_sites.values())
    for s_info in SITES_DATA:
        if len(site_instances) >= 22:
            break
        if s_info["name"] not in existing_sites:
            site = MonitoringSite(
                name=s_info["name"],
                location=s_info["location"],
                latitude=s_info["latitude"],
                longitude=s_info["longitude"],
                protected_area=s_info["protected_area"],
                description=s_info["description"]
            )
            db.add(site)
            site_instances.append(site)
            sites_created += 1
            
    db.commit()
    # Refresh all sites
    for s in site_instances:
        db.refresh(s)
        
    print(f"LOG: Seeded {sites_created} new sites. Total sites: {len(site_instances)}")
    
    # 2. Seed Surveys (Target: 20 total)
    current_surveys_count = db.query(Survey).count()
    surveys_needed = max(0, 20 - current_surveys_count)
    
    existing_surveys = {s.name: s for s in db.query(Survey).all()}
    surveys_created = 0
    survey_instances = list(existing_surveys.values())
    
    for i, surv_info in enumerate(SURVEYS_DATA):
        if len(survey_instances) >= 20:
            break
        if surv_info["name"] not in existing_surveys:
            linked_site = site_instances[i % len(site_instances)]
            survey = Survey(
                name=surv_info["name"],
                date=date.today() - timedelta(days=random.randint(10, 180)),
                monitoring_location=linked_site.location,
                latitude=linked_site.latitude,
                longitude=linked_site.longitude,
                habitat_type=surv_info["habitat_type"],
                monitoring_device=surv_info["monitoring_device"],
                protected_area=linked_site.protected_area,
                description=f"Automated regional surveillance program inside {linked_site.name}.",
                monitoring_site_id=linked_site.id,
                created_by=current_user_id
            )
            db.add(survey)
            survey_instances.append(survey)
            surveys_created += 1
        else:
            survey_instances.append(existing_surveys[surv_info["name"]])
            
    db.commit()
    for s in survey_instances:
        db.refresh(s)
        
    print(f"LOG: Seeded {surveys_created} new surveys. Total surveys: {len(survey_instances)}")
    
    # 3. Seed Camera Traps (Target: 37 total)
    current_traps_count = db.query(CameraTrap).count()
    traps_needed = max(0, 37 - current_traps_count)
    
    existing_traps = {c.camera_id: c for c in db.query(CameraTrap).all()}
    traps_created = 0
    camera_trap_instances = list(existing_traps.values())
    
    for i in range(1, 100):
        if len(camera_trap_instances) >= 37:
            break
        cam_id = f"CAM-IND-{i:03d}"
        if cam_id not in existing_traps:
            linked_site = site_instances[i % len(site_instances)]
            trap = CameraTrap(
                name=f"Camera Trap Node {i:02d}",
                camera_id=cam_id,
                status=random.choice(["Active", "Active", "Active", "Maintenance"]),
                battery_level=random.randint(45, 100),
                location_id=linked_site.id,
                latitude=linked_site.latitude + random.uniform(-0.005, 0.005),
                longitude=linked_site.longitude + random.uniform(-0.005, 0.005),
                model=random.choice(["TrailCam Pro V2", "Browning Strike Force", "Bushnell Trophy"]),
                installation_date=date.today() - timedelta(days=random.randint(30, 360))
            )
            db.add(trap)
            camera_trap_instances.append(trap)
            traps_created += 1
            
    db.commit()
    for c in camera_trap_instances:
        db.refresh(c)
        
    print(f"LOG: Seeded {traps_created} camera traps. Total camera traps: {len(camera_trap_instances)}")

    # 4. Seed Audio Sensors (Target: 37 total)
    current_sensors_count = db.query(AudioSensor).count()
    sensors_needed = max(0, 37 - current_sensors_count)
    
    existing_sensors = {s.sensor_id: s for s in db.query(AudioSensor).all()}
    sensors_created = 0
    audio_sensor_instances = list(existing_sensors.values())
    
    for i in range(1, 100):
        if len(audio_sensor_instances) >= 37:
            break
        sens_id = f"AUD-IND-{i:03d}"
        if sens_id not in existing_sensors:
            linked_site = site_instances[i % len(site_instances)]
            sensor = AudioSensor(
                name=f"Acoustic Sensor Node {i:02d}",
                sensor_id=sens_id,
                status=random.choice(["Active", "Active", "Active", "Maintenance"]),
                battery_level=random.randint(45, 100),
                location_id=linked_site.id,
                latitude=linked_site.latitude + random.uniform(-0.005, 0.005),
                longitude=linked_site.longitude + random.uniform(-0.005, 0.005),
                model=random.choice(["SongMeter SM4", "AudioMoth 1.2.0", "Swift Acoustic Recorder"]),
                installation_date=date.today() - timedelta(days=random.randint(30, 360))
            )
            db.add(sensor)
            audio_sensor_instances.append(sensor)
            sensors_created += 1
            
    db.commit()
    for s in audio_sensor_instances:
        db.refresh(s)
        
    print(f"LOG: Seeded {sensors_created} audio sensors. Total audio sensors: {len(audio_sensor_instances)}")
    
    # 5. Ingest Images (Target: 45 total)
    existing_images_count = db.query(UploadedImage).count()
    images_to_create = max(0, 45 - existing_images_count)
    images_seeded = 0
    
    image_uploads_created = []
    image_species = list(SPECIES_LOCATIONS.keys())
    
    for k in range(images_to_create):
        species = random.choice(image_species)
        allowed_site_names = SPECIES_LOCATIONS[species]
        site_name = random.choice(allowed_site_names)
        
        linked_site = next((s for s in site_instances if s.name == site_name), site_instances[0])
        site_surveys = [s for s in survey_instances if s.monitoring_site_id == linked_site.id]
        if not site_surveys:
            continue
        linked_survey = site_surveys[0]
        
        site_traps = [t for t in camera_trap_instances if t.location_id == linked_site.id]
        if not site_traps:
            continue
        linked_trap = random.choice(site_traps)
        
        sp_folder_name = species.replace(" ", "_")
        sp_sample_dir = os.path.join(SAMPLE_DATA_DIR, "images", sp_folder_name)
        real_files = []
        if os.path.exists(sp_sample_dir):
            real_files = [f for f in os.listdir(sp_sample_dir) if os.path.isfile(os.path.join(sp_sample_dir, f))]
            
        unique_fn = f"{uuid.uuid4()}.jpg"
        db_filepath = f"/uploads/images/{sp_folder_name}/{unique_fn}"
        original_filename = f"{sp_folder_name.lower()}_sample.jpg"
        
        if real_files:
            selected_file = random.choice(real_files)
            original_filename = selected_file
            _, ext = os.path.splitext(selected_file)
            unique_fn = f"{uuid.uuid4()}{ext}"
            
            dest_dir = os.path.join(IMAGES_DIR, sp_folder_name)
            os.makedirs(dest_dir, exist_ok=True)
            
            shutil.copy2(
                os.path.join(sp_sample_dir, selected_file),
                os.path.join(dest_dir, unique_fn)
            )
            db_filepath = f"/uploads/images/{sp_folder_name}/{unique_fn}"
            print(f"LOG: Copied real image asset for {species}: {selected_file}")
        
        already_exists = db.query(UploadedImage).filter(UploadedImage.filepath == db_filepath).first()
        if not already_exists:
            db_img = UploadedImage(
                survey_id=linked_survey.id,
                monitoring_site_id=linked_site.id,
                filename=original_filename,
                filepath=db_filepath,
                uploader_id=current_user_id,
                status="Analyzed" if random.random() < 0.8 else "Pending Analysis",
                uploaded_at=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            db.add(db_img)
            image_uploads_created.append((db_img, species, linked_trap.camera_id))
            images_seeded += 1
            
    db.commit()
    print(f"LOG: Seeded {images_seeded} uploaded images metadata.")
    
    # 6. Seed Audio Uploads (Target: 28 total)
    existing_audio_count = db.query(UploadedAudio).count()
    audio_to_create = max(0, 28 - existing_audio_count)
    audios_seeded = 0
    
    audio_uploads_created = []
    audio_species = list(BIRD_LOCATIONS.keys())
    
    for k in range(audio_to_create):
        species = random.choice(audio_species)
        allowed_site_names = BIRD_LOCATIONS[species]
        site_name = random.choice(allowed_site_names)
        
        linked_site = next((s for s in site_instances if s.name == site_name), site_instances[0])
        site_surveys = [s for s in survey_instances if s.monitoring_site_id == linked_site.id]
        if not site_surveys:
            continue
        linked_survey = site_surveys[0]
        
        site_sensors = [s for s in audio_sensor_instances if s.location_id == linked_site.id]
        if not site_sensors:
            continue
        linked_sensor = random.choice(site_sensors)
        
        sp_folder_name = species.replace(" ", "_")
        sp_sample_dir = os.path.join(SAMPLE_DATA_DIR, "audio", sp_folder_name)
        real_files = []
        if os.path.exists(sp_sample_dir):
            real_files = [f for f in os.listdir(sp_sample_dir) if os.path.isfile(os.path.join(sp_sample_dir, f))]
            
        unique_fn = f"{uuid.uuid4()}.mp3"
        db_filepath = f"/uploads/audio/{sp_folder_name}/{unique_fn}"
        original_filename = f"{sp_folder_name.lower()}_sample.mp3"
        
        if real_files:
            selected_file = random.choice(real_files)
            original_filename = selected_file
            _, ext = os.path.splitext(selected_file)
            unique_fn = f"{uuid.uuid4()}{ext}"
            
            dest_dir = os.path.join(AUDIO_DIR, sp_folder_name)
            os.makedirs(dest_dir, exist_ok=True)
            
            shutil.copy2(
                os.path.join(sp_sample_dir, selected_file),
                os.path.join(dest_dir, unique_fn)
            )
            db_filepath = f"/uploads/audio/{sp_folder_name}/{unique_fn}"
            print(f"LOG: Copied real audio asset for {species}: {selected_file}")
            
        already_exists = db.query(UploadedAudio).filter(UploadedAudio.filepath == db_filepath).first()
        if not already_exists:
            db_aud = UploadedAudio(
                survey_id=linked_survey.id,
                monitoring_site_id=linked_site.id,
                filename=original_filename,
                filepath=db_filepath,
                uploader_id=current_user_id,
                status="Analyzed" if random.random() < 0.8 else "Pending Analysis",
                uploaded_at=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            db.add(db_aud)
            audio_uploads_created.append((db_aud, species, linked_sensor.sensor_id))
            audios_seeded += 1
            
    db.commit()
    print(f"LOG: Seeded {audios_seeded} uploaded audio metadata.")
    
    # 7. Seed Observations (Target: 50 total)
    current_obs_count = db.query(Observation).count()
    obs_needed = max(0, 50 - current_obs_count)
    observations_seeded = 0
    
    # Combine created uploads and pick randomly to seed observations up to target size
    all_new_uploads = []
    for db_img, species, device_id in image_uploads_created:
        all_new_uploads.append(("image", db_img, species, device_id))
    for db_aud, species, device_id in audio_uploads_created:
        all_new_uploads.append(("audio", db_aud, species, device_id))
        
    random.shuffle(all_new_uploads)
    
    # We select a subset of these uploads to generate observations (approx 70-80% of them)
    # until we reach the target observations count or exhaust the uploads.
    for upload_type, db_upload, species, device_id in all_new_uploads:
        if current_obs_count + observations_seeded >= 50:
            break
            
        db.refresh(db_upload)
        # 75% chance of positive wildlife observation record
        # 10% chance of false trigger observation record (no wildlife, empty frame)
        # 15% chance of NO observation record at all (which naturally happens as we break/skip)
        rand_val = random.random()
        
        if rand_val < 0.75:
            # Positive wildlife sighting
            if upload_type == "image":
                already_obs = db.query(Observation).filter(Observation.uploaded_image_id == db_upload.id).first()
                if not already_obs:
                    count = random.randint(1, 4)
                    notes = f"Sighted {count} {species}(s) in deciduous forest cover. Specimen appears healthy."
                    if species == "Bengal Tiger":
                        notes = f"Adult male Bengal Tiger spotted crossing fireline. Dynamic patrol alerted."
                    elif species == "Asian Elephant":
                        notes = f"Elephant herd including sub-adult moving northwards towards riverbed corridor."
                    elif species == "Asiatic Lion":
                        notes = f"Pride of Asiatic Lions resting under canopy scrub. Standard territorial pride."
                    
                    obs = Observation(
                        survey_id=db_upload.survey_id,
                        monitoring_site_id=db_upload.monitoring_site_id,
                        species_name=species,
                        count=count,
                        timestamp=db_upload.uploaded_at,
                        observation_type="Camera Trap",
                        device_id=device_id,
                        notes=notes,
                        status="Analyzed",
                        uploaded_image_id=db_upload.id,
                        created_by=current_user_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(obs)
                    observations_seeded += 1
            else:
                already_obs = db.query(Observation).filter(Observation.uploaded_audio_id == db_upload.id).first()
                if not already_obs:
                    notes = f"Distinct {species} bioacoustic calls parsed from acoustic signature spectral frequency."
                    obs = Observation(
                        survey_id=db_upload.survey_id,
                        monitoring_site_id=db_upload.monitoring_site_id,
                        species_name=species,
                        count=random.randint(1, 3),
                        timestamp=db_upload.uploaded_at,
                        observation_type="Audio Sensor",
                        device_id=device_id,
                        notes=notes,
                        status="Analyzed",
                        uploaded_audio_id=db_upload.id,
                        created_by=current_user_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(obs)
                    observations_seeded += 1
        elif rand_val < 0.85:
            # False trigger (wind movement, rain, empty frame)
            if upload_type == "image":
                already_obs = db.query(Observation).filter(Observation.uploaded_image_id == db_upload.id).first()
                if not already_obs:
                    obs = Observation(
                        survey_id=db_upload.survey_id,
                        monitoring_site_id=db_upload.monitoring_site_id,
                        species_name=None,
                        count=0,
                        timestamp=db_upload.uploaded_at,
                        observation_type="Camera Trap",
                        device_id=device_id,
                        notes="False trigger caused by dense vegetation movement due to heavy wind gusts.",
                        status="Analyzed",
                        uploaded_image_id=db_upload.id,
                        created_by=current_user_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(obs)
                    observations_seeded += 1
            else:
                already_obs = db.query(Observation).filter(Observation.uploaded_audio_id == db_upload.id).first()
                if not already_obs:
                    obs = Observation(
                        survey_id=db_upload.survey_id,
                        monitoring_site_id=db_upload.monitoring_site_id,
                        species_name=None,
                        count=0,
                        timestamp=db_upload.uploaded_at,
                        observation_type="Audio Sensor",
                        device_id=device_id,
                        notes="Acoustic trigger caused by heavy rain backdrop and thunder clipping.",
                        status="Analyzed",
                        uploaded_audio_id=db_upload.id,
                        created_by=current_user_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(obs)
                    observations_seeded += 1
                    
    db.commit()
    print(f"LOG: Seeded {observations_seeded} observations linked to image/audio logs.")
    
    # 8. Extra Standalone Observations (to pad observations to target size of 50 total if still needed)
    total_observations = db.query(Observation).count()
    if total_observations < 50:
        extra_needed = 50 - total_observations
        extra_seeded = 0
        for _ in range(extra_needed):
            species = random.choice(image_species)
            allowed_site_names = SPECIES_LOCATIONS[species]
            site_name = random.choice(allowed_site_names)
            linked_site = next((s for s in site_instances if s.name == site_name), site_instances[0])
            site_surveys = [s for s in survey_instances if s.monitoring_site_id == linked_site.id]
            if not site_surveys:
                continue
            linked_survey = site_surveys[0]
            site_traps = [t for t in camera_trap_instances if t.location_id == linked_site.id]
            device_id = random.choice(site_traps).camera_id if site_traps else "Visual Patrol"
            
            obs = Observation(
                survey_id=linked_survey.id,
                monitoring_site_id=linked_site.id,
                species_name=species,
                count=random.randint(1, 5),
                timestamp=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                observation_type="Camera Trap" if site_traps else "Visual",
                device_id=device_id,
                notes=f"Visual sighting of {species} during routine forestry quadrant check.",
                status="Analyzed",
                created_by=current_user_id,
                created_at=datetime.utcnow()
            )
            db.add(obs)
        db.commit()
        print(f"LOG: Seeded {extra_seeded} extra standalone observations.")

    # 9. Run automatic notification rules to generate matching alerts
    try:
        from app.services.notification_service import run_automatic_notification_rules
        created_notifs = run_automatic_notification_rules(db)
        print(f"LOG: Auto-generated {created_notifs} live alerts based on seeded metrics.")
    except Exception as ne:
        print(f"WARN: Failed to run notification generator: {ne}")

    print(f"LOG: Database seeding process completed successfully!")

