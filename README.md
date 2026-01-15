DiskFlow is an interactive, browser-based educational project designed to help students deeply understand disk scheduling algorithms in Operating Systems through real-time visualization, animation, and performance comparison. Disk scheduling is a fundamental OS concept that directly impacts system performance, response time, and resource utilization. However, it is often taught using static diagrams and numerical examples, which makes it difficult for students to visualize how disk head movement actually occurs in real systems.

This project bridges that gap by transforming abstract disk scheduling concepts into dynamic, visual, and interactive simulations. DiskFlow allows users to input disk request sequences and initial head positions, select different scheduling algorithms, and instantly observe how the disk head moves across tracks in both 2D and 3D environments.

🎯 Motivation Behind DiskFlow

Disk scheduling plays a critical role in determining how efficiently a system accesses data from secondary storage. The total seek time of the disk head directly affects system throughput and performance. Poor scheduling strategies can result in excessive head movement, long delays, and even starvation of requests, while optimized algorithms significantly improve system efficiency.

Despite its importance, students often struggle to understand:

Why SSTF behaves differently from SCAN

How C-SCAN reduces starvation compared to LOOK

How head movement direction affects total seek time

Traditional teaching methods fail to demonstrate the dynamic behavior of disk head traversal. DiskFlow was created to solve this problem by providing a visual, hands-on learning experience.

💡 Key Idea and Approach

DiskFlow is designed as a web-based application, ensuring easy access without installation or configuration. The entire system runs directly in a modern web browser and focuses on simplicity, clarity, and interactivity.

The core idea is to create a pipeline where:

The user provides input (disk requests and head position)

A scheduling algorithm processes the input

The result is visualized step-by-step

Performance metrics are calculated and compared

This approach helps users build strong intuition and conceptual clarity.

⚙️ Disk Scheduling Algorithms Implemented

DiskFlow currently supports the following classical disk scheduling algorithms:

SSTF (Shortest Seek Time First)
Services the request closest to the current head position, minimizing immediate seek time.

SCAN (Elevator Algorithm)
Moves the disk head in one direction servicing requests until it reaches the end, then reverses direction.

C-SCAN (Circular SCAN)
Similar to SCAN, but the head returns to the beginning without servicing requests on the return, reducing starvation.

LOOK Algorithm
An optimized version of SCAN that only goes as far as the last request in each direction.

Each algorithm is implemented using JavaScript and produces:

Request servicing order

Head movement sequence

Total seek time

🎨 Visualization Features
🔹 2D Visualization

Displays disk head movement along a linear track

Animates request servicing step-by-step

Helps users visually follow how each algorithm works

🔹 3D Visualization

Built using Three.js

Represents disk tracks and head movement in a circular layout

Supports zooming, rotation, and exploration

Enhances spatial understanding of disk traversal

These visualizations turn abstract numbers into real movement patterns that are easy to understand.

📊 Performance Comparison Dashboard

DiskFlow includes a comparison dashboard that allows users to evaluate multiple algorithms side by side. Using Chart.js, the dashboard visualizes:

Total seek time

Request servicing order

Algorithm efficiency

This feature helps students understand why one algorithm performs better than another under specific workloads.

🧩 System Architecture

The system follows a modular architecture:

User Input Layer – accepts requests and head position

Algorithm Engine – executes scheduling logic

Visualization Layer – renders 2D and 3D animations

Comparison Dashboard – displays metrics

User Interface – responsive frontend using Bootstrap

This clean separation makes the project easy to extend and maintain.

🛠️ Technologies Used

HTML, CSS, JavaScript – core development

Bootstrap – responsive UI design

Three.js – 3D visualization

Chart.js – performance charts

Canvas / SVG – 2D animations

📦 Project Outcomes

Fully functional disk scheduling visualizer

Interactive 2D and immersive 3D simulations

Side-by-side algorithm comparison

Educational tool for students and faculty

Modern, engaging alternative to textbook learning

🎓 Educational Impact

DiskFlow enhances learning by:

Making OS concepts interactive and engaging

Improving conceptual clarity through visualization

Encouraging experimentation with inputs

Helping students understand real-world OS behavior
