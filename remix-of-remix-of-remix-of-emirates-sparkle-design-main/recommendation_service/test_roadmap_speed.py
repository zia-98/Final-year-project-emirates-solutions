
import time
from roadmap_generator import AI_RoadmapGenerator

def test_speed():
    generator = AI_RoadmapGenerator()
    
    test_titles = [
        "Python Web Development",
        "Data Science"
    ]
    
    for title in test_titles:
        print(f"\n--- Testing Speed for: {title} ---")
        start = time.time()
        roadmap = generator.generate(title, duration="4 weeks")
        end = time.time()
        
        if isinstance(roadmap, list):
            print(f"SUCCESS: Generated {len(roadmap)} weeks in {end-start:.2f} seconds.")
        else:
            print(f"FAILED: {roadmap.get('error', 'Unknown error')} (Took {end-start:.2f}s)")

if __name__ == "__main__":
    test_speed()
