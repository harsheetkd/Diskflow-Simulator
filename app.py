from flask import Flask, request, jsonify, send_from_directory, render_template
from pathlib import Path
import math
import joblib
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

def fcfs(requests, head, disk_size=199, **kwargs):
    if not requests:
        return [head], 0
    # Make a copy of requests to avoid modifying the original
    requests = list(requests)
    order = [head]
    current = head
    total_distance = 0
    
    # Process each request in the order they appear
    for request in requests:
        distance = abs(request - current)
        total_distance += distance
        current = request
        order.append(current)
    
    return order, total_distance

def sstf(requests, head, disk_size=199, **kwargs):
    req = requests[:]
    cur = head
    order = [head]
    dist = 0
    while req:
        closest = min(req, key=lambda x: abs(x-cur))
        dist += abs(closest-cur)
        cur = closest
        order.append(cur)
        req.remove(closest)
    return order, dist

def scan(requests, head, disk_size=199, direction='right'):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    order = [head]
    dist = 0
    cur = head
    if direction == 'right':
        for r in right:
            dist += abs(r-cur); cur = r; order.append(r)
        dist += abs(disk_size - cur); cur = disk_size; order.append(cur)
        for r in reversed(left):
            dist += abs(r-cur); cur = r; order.append(r)
    else:
        for r in reversed(left):
            dist += abs(r-cur); cur = r; order.append(r)
        dist += abs(0 - cur); cur = 0; order.append(cur)
        for r in right:
            dist += abs(r-cur); cur = r; order.append(r)
    return order, dist

def cscan(requests, head, disk_size=199, direction='right'):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    order = [head]; dist = 0; cur = head
    if direction == 'right':
        for r in right:
            dist += abs(r-cur); cur = r; order.append(r)
        if right:
            dist += abs(disk_size - cur); cur = disk_size; order.append(cur)
        dist += abs(disk_size - 0); cur = 0; order.append(cur)
        for r in left:
            dist += abs(r-cur); cur = r; order.append(r)
    else:
        for r in reversed(left):
            dist += abs(r-cur); cur = r; order.append(r)
        if left:
            dist += abs(0 - cur); cur = 0; order.append(cur)
        dist += abs(disk_size - 0); cur = disk_size; order.append(cur)
        for r in reversed(right):
            dist += abs(r-cur); cur = r; order.append(r)
    return order, dist

ALGORITHMS = {
    'FCFS': fcfs,
    'SSTF': sstf,
    'SCAN': scan,
    'CSCAN': cscan
}

# Load ML model if available
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml_model.joblib')
ML_MODEL = None
ML_FEATURES = None
if os.path.exists(MODEL_PATH):
    try:
        data = joblib.load(MODEL_PATH)
        ML_MODEL = data.get('model') if isinstance(data, dict) else data
        ML_FEATURES = data.get('features') if isinstance(data, dict) else None
    except Exception:
        ML_MODEL = None
        ML_FEATURES = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json or {}
    alg = data.get('algorithm', 'FCFS').upper()
    try:
        requests = list(map(int, data.get('requests', [])))
        head = int(data.get('head', 0))
        disk_size = int(data.get('disk_size', 199))
    except Exception as e:
        return jsonify({'error': 'Invalid inputs: %s' % str(e)}), 400

    if alg not in ALGORITHMS:
        return jsonify({'error': 'Algorithm not supported'}), 400

    func = ALGORITHMS[alg]
    order, distance = func(requests, head, disk_size=disk_size)
    moves = [abs(order[i] - order[i-1]) for i in range(1, len(order))]
    total_seek = sum(moves)
    avg_seek = (total_seek / len(moves)) if moves else 0
    max_seek = max(moves) if moves else 0
    total_requests = len(requests)

    return jsonify({
        'algorithm': alg,
        'order': order,
        'total_distance': distance,
        'total_seek': total_seek,
        'avg_seek': avg_seek,
        'max_seek': max_seek,
        'total_requests': total_requests,
        'requests': requests,
        'head': head
    })


@app.route('/recommend', methods=['POST'])
def recommend():
    if ML_MODEL is None or ML_FEATURES is None:
        return jsonify({'error': 'ML model not available. Train the model first.'}), 503
    data = request.json or {}
    try:
        requests = list(map(int, data.get('requests', [])))
        head = int(data.get('head', 0))
        disk_size = int(data.get('disk_size', 199))
    except Exception as e:
        return jsonify({'error': 'Invalid inputs: %s' % str(e)}), 400

    # Build feature vector in same order as ML_FEATURES
    from ml_model import extract_features
    feats = extract_features(requests, head, disk_size)
    X = [feats.get(f, 0) for f in ML_FEATURES]
    probs = ML_MODEL.predict_proba([X])[0].tolist()
    classes = ML_MODEL.classes_.tolist()
    ranked = sorted(list(zip(classes, probs)), key=lambda x: -x[1])
    return jsonify({'ranking': ranked})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
