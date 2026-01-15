# Diskflow-Simulator
DiskFlow is an interactive, browser-based educational tool for understanding disk scheduling algorithms in Operating Systems. It replaces static diagrams with real-time 2D and 3D visualizations, allowing users to input requests, select algorithms, and observe disk head movement and performance comparisons dynamically.
Disk Scheduling Simulator - Simplified
This simplified project bundles a Flask backend that implements disk scheduling algorithms (FCFS, SSTF, SCAN, CSCAN) and serves a minimal HTML/CSS/JS frontend.

Files
app.py : Flask app (API + serves frontend)
templates/index.html : Frontend page
static/styles.css, static/script.js : Frontend assets
launcher.py : small Tkinter-less launcher (uses browser); kept for convenience
requirements.txt : Python requirements
How to run
Create a virtualenv and install dependencies:
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
Run the app:
python app.py
Open http://127.0.0.1:5000 in your browser.
Notes
I kept architecture simple: backend (Flask) + frontend (static files). The frontend calls /simulate with JSON and receives the ordering + total distance.
If you want a pure desktop GUI using Tkinter (embedded), I can convert the frontend to a Tkinter UI later. For now, launching the browser is the simplest cross-platform approach.
