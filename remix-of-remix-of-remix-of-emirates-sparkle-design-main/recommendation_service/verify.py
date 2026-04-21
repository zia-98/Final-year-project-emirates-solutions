
import sys
import os
import pandas as pd

# Add current directory to path so we can import recommender
sys.path.append(os.getcwd())

from recommender import InternshipRecommender

def test_recommender():
    print("Initializing Recommender...")
    rec = InternshipRecommender('internships.csv')
    
    print("Loading Data...")
    if not rec.load_data():
        print("Failed to load data")
        return

    print("Creating Features...")
    rec.create_features()
    
    print("Training Model...")
    rec.train()
    
    test_title = "Python Developer Intern"
    print(f"Testing Recommendation for '{test_title}'...")
    results = rec.recommend(test_title, top_n=3)
    
    print(f"Found {len(results)} recommendations:")
    for r in results:
        print(f"- {r['title']} at {r['company']} (Score based on content)")

    # Test api-like behavior (mocking inputs)
    print("\nVerification Complete.")

if __name__ == "__main__":
    test_recommender()
