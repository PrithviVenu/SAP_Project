import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from analyze_abap import analyze_abap

app = Flask(__name__)
CORS(app)

def clean_openai_json(raw_text: str) -> str:
    # Remove markdown ```json ... ``` block, excluding the triple backticks and "json" label
    pattern = r"```json\s*\n(.*?)\n```"
    match = re.search(pattern, raw_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # fallback: remove ``` ... ``` block without json label
    pattern2 = r"```(.*?)```"
    match2 = re.search(pattern2, raw_text, re.DOTALL)
    if match2:
        return match2.group(1).strip()
    return raw_text.strip()

def remove_trailing_commas(json_str: str) -> str:
    # Remove trailing commas before } or ] to fix invalid JSON from OpenAI
    json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
    return json_str

@app.route("/analyze", methods=["POST"])
def analyze_endpoint():
    data = request.get_json()
    code = data.get("code")

    if not code:
        return jsonify({"error": "ABAP code is required"}), 400

    try:
        result = analyze_abap(code)
        #print("Raw OpenAI response:", repr(result))

        clean_result = clean_openai_json(result)
        #print("Cleaned JSON string before fixing commas:", repr(clean_result))

        fixed_json = remove_trailing_commas(clean_result)
        #print("JSON string after removing trailing commas:", repr(fixed_json))

        # Fallback: if the cleaned response doesn’t start with a JSON object
        if not fixed_json.strip().startswith("{"):
         return jsonify({
            "analysis": {
                "compatibility": "Unknown",
                "issues": ["Unable to parse the response as JSON."],
                "recommendations": ["Ensure the ABAP code input is correct."],
                "converted_code": "N/A"
            }
        })
        if not fixed_json:
            return jsonify({"error": "Empty JSON response from analyzer"}), 500

        analysis_json = json.loads(fixed_json)
        required_keys = {"compatibility", "issues", "recommendations", "converted_code"}
        if not required_keys.issubset(analysis_json.keys()):
            return jsonify({"error": "Incomplete analysis data"}), 500
        
        return jsonify({"analysis": analysis_json})
    
    except Exception as e:
        print("Error parsing JSON:", e)
        return jsonify({"error": f"Failed to analyze ABAP code: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)