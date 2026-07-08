import streamlit as st
import pandas as pd
import numpy as np
import datetime
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# --- 1. SET UP THE AI SCHEMA & FUNCTION ---

class BilingualAgronomyAdvice(BaseModel):
    risk_level: str = Field(description="Severity of the issue: Low, Medium, or High.")
    english_title: str = Field(description="A short, urgent headline in English.")
    english_steps: list[str] = Field(description="3 actionable bullet points for the farmer in English.")
    hindi_title: str = Field(description="The exact translation of the short headline in Hindi.")
    hindi_steps: list[str] = Field(description="The exact translation of the 3 actionable bullet points in Hindi.")

def get_ai_advice(temperature, moisture, stress_index):
    client = genai.Client() # Remember to set your API key in your environment or temporarily paste it here!
    
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

# --- 2. BUILD THE STREAMLIT UI ---

st.set_page_config(page_title="Agritech AI Monitor", page_icon="🌱", layout="wide")
st.title("🌱 Smart Farm Diagnostic Dashboard")

# Create Main Tabs for the Dashboard
tab_diagnostics, tab_analytics, tab_fleet = st.tabs(["🩺 Live Diagnostics", "📈 Historical Analytics", "🗺️ Sensor Fleet"])

# --- SIDEBAR (Persistent across all tabs) ---
with st.sidebar:
    st.header("🎛️ Live Sensor Controls")
    st.write("Simulate current environmental changes:")
    current_temp = st.slider("Ambient Temperature (°C)", min_value=10.0, max_value=50.0, value=38.5, step=0.5)
    current_moisture = st.slider("Soil Moisture (%)", min_value=0.0, max_value=100.0, value=9.2, step=0.5)
    current_stress = current_temp / (current_moisture + 0.001)

# ==========================================
# TAB 1: LIVE AI DIAGNOSTICS
# ==========================================
with tab_diagnostics:
    st.write("Adjust the live telemetry in the sidebar to see how the AI system diagnoses crop health.")
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Temperature", f"{current_temp} °C")
    col2.metric("Soil Moisture (0-7cm)", f"{current_moisture} %")
    col3.metric("Crop Stress Index", f"{current_stress:.2f}")

    st.divider()

    if st.button("🚀 Run AI Diagnostics", type="primary"):
        with st.spinner("Analyzing telemetry and generating localized advice..."):
            try:
                advice = get_ai_advice(current_temp, current_moisture, current_stress)
                
                if advice["risk_level"] in ["High", "Medium"]:
                    st.warning(f"⚠️ {advice['risk_level']} Risk Anomaly Detected!")
                else:
                    st.success("✅ Conditions are optimal.")

                # Side-by-side Bilingual Output
                col_en, col_hi = st.columns(2)
                
                with col_en:
                    st.subheader("🇺🇸 " + advice["english_title"])
                    for step in advice["english_steps"]:
                        st.markdown(f"- {step}")
                        
                with col_hi:
                    st.subheader("🇮🇳 " + advice["hindi_title"])
                    for step in advice["hindi_steps"]:
                        st.markdown(f"- {step}")
                
                st.divider()
                
                # --- NEW LAYOUT: EXPANDER & COLUMNS ---
                bottom_col1, bottom_col2 = st.columns(2)
                
                with bottom_col1:
                    # Allow recruiters to peek under the hood at the raw JSON
                    with st.expander("🛠️ View Developer Payload (Raw JSON)"):
                        st.json(advice)
                        
                with bottom_col2:
                    report_content = f"FARM DIAGNOSTIC REPORT\nDate: {datetime.date.today()}\nTemp: {current_temp}°C | Moisture: {current_moisture}%\n\nACTION PLAN:\n"
                    for step in advice["english_steps"]:
                        report_content += f"- {step}\n"
                    st.download_button("📄 Download Diagnostic Report", data=report_content, file_name="farm_report.txt", mime="text/plain")

            except Exception as e:
                st.error(f"Failed to connect to AI pipeline. Error: {e}")

# ==========================================
# TAB 2: HISTORICAL ANALYTICS
# ==========================================
with tab_analytics:
    st.header("7-Day Telemetry Trends")
    
    # Mock Data Generation
    dates = pd.date_range(end=pd.Timestamp.now(), periods=7*24, freq='h')
    mock_temps = np.random.normal(32, 4, len(dates)) 
    mock_moisture = np.random.normal(45, 10, len(dates))
    
    df_history = pd.DataFrame({
        "Temperature (°C)": mock_temps,
        "Soil Moisture (%)": mock_moisture
    }, index=dates)
    
    # --- NEW LAYOUT: CHARTS + DATAFRAME ---
    # We split the screen: charts on the left, raw data table on the right
    chart_col, table_col = st.columns([2, 1]) # The chart column is twice as wide
    
    with chart_col:
        st.subheader("Temperature Over Time")
        st.line_chart(df_history["Temperature (°C)"], color="#FF4B4B")
        
        st.subheader("Soil Moisture Over Time")
        st.line_chart(df_history["Soil Moisture (%)"], color="#0068C9")
        
    with table_col:
        st.subheader("Raw Data Logs")
        # st.dataframe creates a scrollable, sortable table
        st.dataframe(df_history.style.highlight_max(axis=0), height=600)

# ==========================================
# TAB 3: SENSOR FLEET (NEW FEATURE)
# ==========================================
with tab_fleet:
    st.header("📍 IoT Sensor Fleet Status")
    st.write("Live geographic status of deployed hardware across the agricultural grid.")
    
    # Generate mock coordinates around a central farm location (e.g., Bengaluru outskirts)
    base_lat, base_lon = 13.1, 77.6
    sensor_data = pd.DataFrame(
        np.random.randn(5, 2) / [50, 50] + [base_lat, base_lon],
        columns=['latitude', 'longitude']
    )
    sensor_data['Sensor ID'] = ['SN-101', 'SN-102', 'SN-103', 'SN-104', 'SN-105']
    sensor_data['Status'] = ['Active', 'Active', 'Offline (Battery)', 'Active', 'Active']
    
    map_col, info_col = st.columns([3, 1])
    
    with map_col:
        # Streamlit's native map tool automatically reads 'latitude' and 'longitude' columns
        st.map(sensor_data, size=200, color="#00ff00")
        
    with info_col:
        st.subheader("Hardware Status")
        # Display the sensor status without the index numbers for a cleaner look
        st.dataframe(sensor_data[['Sensor ID', 'Status']], hide_index=True)