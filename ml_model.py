import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
from app import fcfs, sstf, scan, cscan

ALGS = ['FCFS', 'SSTF', 'SCAN', 'CSCAN']


def extract_features(requests, head, disk_size=199):
    x = {}
    arr = np.array(requests) if len(requests) else np.array([head])
    x['num_requests'] = len(requests)
    x['head_pos'] = head
    x['disk_size'] = disk_size
    x['mean'] = float(np.mean(arr))
    x['std'] = float(np.std(arr))
    x['min'] = float(np.min(arr))
    x['max'] = float(np.max(arr))
    x['median'] = float(np.median(arr))
    # distance from head to mean
    x['dist_head_mean'] = abs(head - x['mean'])
    # cluster measure: average nearest neighbor distance
    if len(arr) > 1:
        nn = []
        for v in arr:
            others = np.delete(arr, np.where(arr==v))
            if len(others):
                nn.append(np.min(np.abs(others - v)))
        x['avg_nn'] = float(np.mean(nn)) if nn else 0.0
    else:
        x['avg_nn'] = 0.0
    return x


def simulate_all(requests, head, disk_size=199):
    sims = {}
    for alg in ALGS:
        if alg == 'FCFS':
            order, dist = fcfs(requests, head, disk_size=disk_size)
        elif alg == 'SSTF':
            order, dist = sstf(requests, head, disk_size=disk_size)
        elif alg == 'SCAN':
            order, dist = scan(requests, head, disk_size=disk_size)
        elif alg == 'CSCAN':
            order, dist = cscan(requests, head, disk_size=disk_size)
        sims[alg] = {'order': order, 'distance': dist}
    return sims


def best_algorithm_from_sim(requests, head, disk_size=199):
    sims = simulate_all(requests, head, disk_size=disk_size)
    best = min(sims.items(), key=lambda kv: kv[1]['distance'])[0]
    return best


def generate_synthetic_dataset(n_samples=1000, max_reqs=12, disk_size=199, random_state=42):
    rng = np.random.RandomState(random_state)
    rows = []
    labels = []
    for _ in range(n_samples):
        num_reqs = rng.randint(1, max_reqs+1)
        requests = list(rng.randint(0, disk_size+1, size=num_reqs))
        head = int(rng.randint(0, disk_size+1))
        feats = extract_features(requests, head, disk_size)
        label = best_algorithm_from_sim(requests, head, disk_size)
        rows.append(feats)
        labels.append(label)
    df = pd.DataFrame(rows)
    df['label'] = labels
    return df


def train_model(df=None, save_path='ml_model.joblib', test_size=0.2, random_state=42):
    if df is None:
        df = generate_synthetic_dataset(n_samples=2000)
    X = df.drop(columns=['label'])
    y = df['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
    clf = RandomForestClassifier(n_estimators=100, random_state=random_state)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    joblib.dump({'model': clf, 'features': list(X.columns)}, save_path)
    return clf, acc


def load_model(path='ml_model.joblib'):
    data = joblib.load(path)
    return data['model'], data['features']


def predict_best_algorithm(requests, head, disk_size=199, model=None, features=None, model_path='ml_model.joblib'):
    if model is None:
        model, features = load_model(model_path)
    feats = extract_features(requests, head, disk_size)
    X = np.array([feats[f] for f in features]).reshape(1, -1)
    probs = model.predict_proba(X)[0]
    classes = model.classes_
    res = list(sorted(zip(classes, probs), key=lambda x: -x[1]))
    return res


if __name__ == '__main__':
    print('Generating dataset...')
    df = generate_synthetic_dataset(n_samples=1000)
    print('Training model...')
    clf, acc = train_model(df, save_path='ml_model.joblib')
    print('Trained model accuracy:', acc)
