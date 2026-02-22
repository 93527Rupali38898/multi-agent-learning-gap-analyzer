from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import socketio
from core.hints import get_level_hint 

app = FastAPI()

# 1. Socket.io Setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SOCKET EVENTS ---

@sio.on("join_problem")
async def handle_join(sid, data):
    # Laptop aur Mobile dono isse join karenge: socket.emit("join_problem", {problemId: "DSA-01"})
    room = data['problemId']
    sio.enter_room(sid, room)
    print(f"Client {sid} joined room: {room}")

@sio.on("lens_frame")
async def handle_lens_frame(sid, data):
    frame = data['frame'] # Base64 Image
    problem_id = data['problemId']
    
    # 3. Gemini Vision Logic
    # Yahan hum 'image_data' parameter pass kar rahe hain jo hints.py handle karega
    hint = get_level_hint(
        level=1, 
        code="", 
        problem_title="Visual Analysis", 
        description="User shared a frame via Sutra Lens", 
        image_data=frame
    )
    
    print(f"Gemini Lens Hint for {problem_id}: {hint}")
    
    # 4. FIX: Room mein hint bhejna taaki IDE (Laptop) ko mile
    await sio.emit("lens_hint", {"hint": hint}, room=problem_id)

# --- HTTP ENDPOINTS ---

@app.post("/ai/hint")
async def ai_hint(payload: dict = Body(...)):
    level = payload.get("level", 1)
    code = payload.get("code", "")
    problem_title = payload.get("problem", "")
    description = payload.get("description", "")
    
    hint = get_level_hint(level, code, problem_title, description)
    return {"hint": hint}

# 5. Mount & Run
app.mount("/ws", socket_app)

# Run command:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload