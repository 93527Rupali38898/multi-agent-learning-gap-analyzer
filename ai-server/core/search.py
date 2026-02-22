from thefuzz import process, fuzz

def perform_fuzzy_search(query, topic, data):
    if not query:
        return [p for p in data if p.get('topic') == topic]

    # Filter by topic first
    topic_problems = [p for p in data if p.get('topic') == topic]
    title_map = {p['title']: p for p in topic_problems}
    
    # WRatio use kar rahe hain for best matching
    results = process.extract(
        query, 
        title_map.keys(), 
        limit=10, 
        scorer=fuzz.WRatio
    )
    
    return [title_map[title] for title, score in results if score >= 50]