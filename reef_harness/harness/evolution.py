import json

def grade_text(task: str, text: str | None) -> float:
    """Extracts the JSON from the LLM's text output and checks if it matches the expected parsing for the task."""
    if not text:
        return 0.0
    
    try:
        # Extremely simple mock grader for the fixtures
        parsed = json.loads(text)
        if task.startswith("[soic]") and parsed.get("pkg_type") == "soic" and parsed.get("pins") == 14:
            return 1.0
        if task.startswith("[bga]") and parsed.get("pkg_type") == "bga" and parsed.get("pins") == 64:
            return 1.0
        if task.startswith("[dip]") and parsed.get("pkg_type") == "dip" and parsed.get("pins") == 8:
            return 1.0
        return 0.0
    except Exception:
        return 0.0

def propose(nodes, samples, models, *, requests=()):
    """Delegate service-side proposals to the built-in recipe."""
    from reef.recipe.reefine.evolution import propose as reefine_propose
    return reefine_propose(nodes, samples, models, requests=requests)

def evaluate(task: str, result) -> float:
    """Delegate service-side episode scoring to the built-in recipe."""
    from reef.recipe.reefine.evolution import evaluate as reefine_evaluate
    return reefine_evaluate(task, result)
