import subprocess, webbrowser, time, sys, os
from pathlib import Path

ROOT = Path(__file__).parent
env = os.environ.copy()
p = subprocess.Popen([sys.executable, 'app.py'], cwd=str(ROOT))
print('Starting Flask server (pid=%d)...' % p.pid)
time.sleep(1.5)
webbrowser.open('http://127.0.0.1:5000/')
try:
    p.wait()
except KeyboardInterrupt:
    p.terminate()
