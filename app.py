import os
import json
import datetime
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Load environment variables from .env file
load_dotenv(override=True)

# --- 1. SET UP THE AI SCHEMA & FUNCTION ---

class BilingualAgronomyAdvice(BaseModel):
    risk_level: str = Field(description="Severity of the issue: Low, Medium, or High.")
    english_title: str = Field(description="A short, urgent headline in English.")
    english_steps: list[str] = Field(description="3 actionable bullet points for the farmer in English.")
    hindi_title: str = Field(description="The exact translation of the short headline in Hindi.")
    hindi_steps: list[str] = Field(description="The exact translation of the 3 actionable bullet points in Hindi.")

def get_ai_advice(temperature, moisture, stress_index):
    # Verify api key is present. In production/test environments,
    # the client will look for GEMINI_API_KEY env variable automatically.
    # Standard fallback if not set to help developers debug.
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key.startswith("YOUR_"):
        # We can raise an error or fall back to simulated response for testing convenience.
        # Let's check if the API key is present. If not, we will generate a mock response
        # to ensure the dashboard works even if the user hasn't set the key yet.
        return {
            "risk_level": "Medium" if stress_index > 2.0 else "Low",
            "english_title": "Soil Moisture Warning" if stress_index > 2.0 else "Optimal Crop Conditions",
            "english_steps": [
                "Schedule light irrigation within the next 4 hours.",
                "Inspect soil around zone 3 for high evaporation rates.",
                "Monitor leaf temperatures for early signs of heat stress."
            ] if stress_index > 2.0 else [
                "Maintain current automated irrigation schedule.",
                "Ensure shade nets are functioning during peak daylight hours.",
                "Telemetry indicates tomato plants are in active growth phase."
            ],
            "hindi_title": "मिट्टी की नमी की चेतावनी" if stress_index > 2.0 else "इष्टतम फसल स्थितियां",
            "hindi_steps": [
                "अगले 4 घंटों के भीतर हल्की सिंचाई का समय निर्धारित करें।",
                "उच्च वाष्पीकरण दर के लिए क्षेत्र 3 के आसपास की मिट्टी का निरीक्षण करें।",
                "गर्मी के तनाव के शुरुआती संकेतों के लिए पत्तियों के तापमान की निगरानी करें।"
            ] if stress_index > 2.0 else [
                "वर्तमान स्वचालित सिंचाई कार्यक्रम बनाए रखें।",
                "सुनिश्चित करें कि चरम दिन के उजाले के दौरान छाया जाल काम कर रहे हैं।",
                "टेलीमेट्री से पता चलता है कि टमाटर के पौधे सक्रिय विकास चरण में हैं।"
            ]
        }

    client = genai.Client()
    
    prompt = f"""
    You are an expert automated agronomy consultant system. 
    Analyze this real-time tomato farm telemetry:
    - Temperature: {temperature}°C
    - Soil Moisture: {moisture}%
    - Stress Index: {stress_index:.2f}
    
    Provide immediate corrective actions.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BilingualAgronomyAdvice,
            temperature=0.1, 
        ),
    )
    return json.loads(response.text)


# --- 2. FASTAPI SERVER ---

app = FastAPI(title="Agritech AI Monitor API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryInput(BaseModel):
    temperature: float
    moisture: float

@app.post("/api/diagnose")
async def run_diagnostics(data: TelemetryInput):
    stress_index = data.temperature / (data.moisture + 0.001)
    try:
        advice = get_ai_advice(data.temperature, data.moisture, stress_index)
        # Add stress index to return payload for frontend convenience
        advice["stress_index"] = round(stress_index, 2)
        advice["timestamp"] = datetime.datetime.now().isoformat()
        return advice
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Diagnostic pipeline error: {str(e)}")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    message: str
    history: list[ChatMessage] = []
    temperature: float | None = None
    moisture: float | None = None

@app.post("/api/chat")
async def chat_interaction(data: ChatInput):
    # Verify api key is present. If not, fallback to simulated response.
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key.startswith("YOUR_"):
        msg_lower = data.message.lower()
        temp_val = data.temperature if data.temperature is not None else 25.0
        moist_val = data.moisture if data.moisture is not None else 50.0
        stress_val = temp_val / (moist_val + 0.001)
        
        reply = ""
        if "moisture" in msg_lower or "water" in msg_lower or "irrigation" in msg_lower:
            if moist_val < 20.0:
                reply = f"Currently, your soil moisture is critically low at {moist_val}%. I recommend scheduling an immediate irrigation event for the affected zone. Tomato crops require consistent soil moisture; dry spells followed by heavy watering lead to fruit cracking and blossom-end rot."
            elif moist_val > 80.0:
                reply = f"Your soil moisture level is quite high at {moist_val}%. Over-irrigation can lead to root rot and anaerobic soil conditions. Consider delaying the next watering cycle until moisture levels drop to around 40-50%."
            else:
                reply = f"Your current soil moisture is at an optimal {moist_val}%. Continue with your standard scheduled irrigation. Keep monitoring daily temperature trends as evaporation increases."
        elif "stress" in msg_lower or "health" in msg_lower or "condition" in msg_lower:
            if stress_val > 2.0:
                reply = f"The crop stress index is elevated at {stress_val:.2f} due to high temperature ({temp_val}°C) and low moisture ({moist_val}%). High stress levels stunt tomato growth and reduce pollination rates. You should activate shading nets and increase soil hydration immediately."
            else:
                reply = f"The crop stress index is healthy at {stress_val:.2f}. Ambient conditions are favorable. Ensure shade systems are adjusted automatically during peak solar intensity."
        elif "temp" in msg_lower or "heat" in msg_lower or "warm" in msg_lower:
            if temp_val > 35.0:
                reply = f"The ambient temperature is very warm ({temp_val}°C). High temperatures inhibit fruit set in tomatoes and increase transpiration rate. Ensure shade nets are deployed and misting systems (if available) are cycled to lower temperature."
            elif temp_val < 15.0:
                reply = f"The current temperature is low ({temp_val}°C). Tomatoes thrive between 20°C and 30°C. Cold air can slow development. Monitor greenhouse heating if applicable."
            else:
                reply = f"Ambient temperature is {temp_val}°C, which is well within the optimal range of 20-30°C for tomato vine growth and active flowering."
        elif "blight" in msg_lower or "disease" in msg_lower or "spot" in msg_lower or "leaf" in msg_lower:
            reply = "Early blight and late blight are common fungal issues for tomatoes. Typical indicators are dark concentric spots on older leaves. To prevent blight: 1) Avoid overhead sprinkler watering to keep foliage dry, 2) Ensure good air circulation by pruning lower leaves, and 3) Apply organic copper fungicides if symptoms persist."
        elif "fertilizer" in msg_lower or "nutrient" in msg_lower or "npk" in msg_lower:
            reply = "For tomato plants, use a balanced NPK fertilizer (like 10-10-10) during early growth. Once flowering and fruit set begin, switch to a low-nitrogen, high-potassium/phosphorus fertilizer (such as 5-10-10 or 8-24-24) to promote heavy fruiting instead of excessive leaf growth. Adding calcium also prevents blossom-end rot."
        else:
            reply = f"Hello! I am your SmartFarm AI Advisor. Currently, my Gemini API key is not configured, so I am running in Demo Mode. \n\n**Current Telemetry Context:**\n- Temperature: {temp_val}°C\n- Soil Moisture: {moist_val}%\n- Crop Stress Index: {stress_val:.2f}\n\nAsk me about irrigation, crop stress, diseases (like blight), or NPK fertilization, and I will parse your questions relative to this live telemetry!"
        
        return {
            "response": reply,
            "timestamp": datetime.datetime.now().isoformat(),
            "demo_mode": True
        }

    # If GEMINI_API_KEY is present, call Gemini API
    client = genai.Client()
    
    # Compile system instruction with optional telemetry context
    sys_instruction = "You are a helpful, expert AI agronomy advisor on the SmartFarm platform. You advise farmers on soil health, tomato farming, irrigation, crop diseases, fertilizer application, and smart agriculture telemetry. Keep your responses engaging, clear, and actionable. Use bullet points, paragraphs, and bold text where appropriate."
    if data.temperature is not None and data.moisture is not None:
        stress_val = data.temperature / (data.moisture + 0.001)
        sys_instruction += f"\n\nCURRENT TELEMETRY CONTEXT: Temperature is {data.temperature}°C, Soil Moisture is {data.moisture}%, calculated Crop Stress Index is {stress_val:.2f}. Reference these live parameters when advising on the current state if relevant."

    # Format the conversational history
    contents = []
    for msg in data.history:
        role = "user" if msg.role == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.content)]
            )
        )
    
    # Add the current message
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=data.message)]
        )
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruction,
                temperature=0.7, 
            ),
        )
        return {
            "response": response.text,
            "timestamp": datetime.datetime.now().isoformat(),
            "demo_mode": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chatbot service error: {str(e)}")


@app.get("/api/historical")
async def get_historical_data():
    try:
        # Mock Data Generation: 7 days of hourly records (168 records)
        dates = pd.date_range(end=pd.Timestamp.now(), periods=7*24, freq='h')
        
        # Consistent random walk for realistic charts
        np.random.seed(42)
        
        # Generate temperature with diurnal cycles (warmer in afternoon, cooler at night)
        hour_of_day = dates.hour
        base_temp = 25.0 + 10.0 * np.sin((hour_of_day - 6) * (2 * np.pi / 24))
        mock_temps = base_temp + np.random.normal(0, 1.5, len(dates))
        
        # Soil moisture decreases slowly, spikes up on mock irrigation events
        mock_moisture = []
        curr_moist = 60.0
        for i, dt in enumerate(dates):
            # simulate evaporation
            evap = 0.5 if dt.hour in range(10, 17) else 0.1
            curr_moist -= evap + np.random.normal(0, 0.05)
            # simulated irrigation events (e.g., every 36 hours or when low)
            if curr_moist < 15.0 or (i > 0 and i % 36 == 0):
                curr_moist = float(np.random.uniform(55.0, 70.0))
            mock_moisture.append(max(0.0, min(100.0, curr_moist)))
            
        df = pd.DataFrame({
            "timestamp": dates.strftime("%Y-%m-%dT%H:%M:%S"),
            "temperature": np.round(mock_temps, 1),
            "moisture": np.round(mock_moisture, 1)
        })
        
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate historical analytics: {str(e)}")

@app.get("/api/sensors")
async def get_sensor_fleet():
    try:
        # Sensor data around Bengaluru outskirts (similar to Streamlit map coordinates)
        sensors = [
            {
                "id": "SN-101",
                "name": "North Tomato Patch",
                "latitude": 13.102,
                "longitude": 77.601,
                "status": "Active",
                "battery": 88,
                "signal": "Excellent",
                "temperature": 28.4,
                "moisture": 42.1
            },
            {
                "id": "SN-102",
                "name": "East Greenhouse",
                "latitude": 13.098,
                "longitude": 77.605,
                "status": "Active",
                "battery": 94,
                "signal": "Good",
                "temperature": 32.1,
                "moisture": 35.8
            },
            {
                "id": "SN-103",
                "name": "South Nursery Zone",
                "latitude": 13.095,
                "longitude": 77.597,
                "status": "Offline (Battery)",
                "battery": 2,
                "signal": "None",
                "temperature": 0.0,
                "moisture": 0.0
            },
            {
                "id": "SN-104",
                "name": "West Orchard",
                "latitude": 13.105,
                "longitude": 77.595,
                "status": "Active",
                "battery": 72,
                "signal": "Fair",
                "temperature": 27.8,
                "moisture": 48.3
            },
            {
                "id": "SN-105",
                "name": "Central Hydroponics",
                "latitude": 13.101,
                "longitude": 77.599,
                "status": "Active",
                "battery": 45,
                "signal": "Excellent",
                "temperature": 29.5,
                "moisture": 52.0
            }
        ]
        return sensors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sensor fleet data: {str(e)}")

# Mount static build folder in production
dist_path = os.path.join(os.path.dirname(__file__), "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

    # Catch-all to redirect path queries to React Router/spa
    @app.get("/{catchall:path}")
    async def read_index(catchall: str):
        # Prevent API routes from being swallowed by catch-all
        if catchall.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Static files not built yet")
else:
    @app.get("/")
    async def root():
        return {"message": "FastAPI is running. Frontend static files not found in /dist. Run frontend locally using npm dev server."}