export interface MappedResource {
  title: string;
  topic: string;
  provider: string;
  type: "Course" | "Tutorial" | "Documentation" | "Practice" | "Reference";
  url: string;
  reason?: string;
}

/**
 * Checks if a given URL is a generic website homepage rather than a topic-specific direct resource URL.
 */
export function isHomepageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim().toLowerCase();
  const genericHomepages = [
    "https://www.geeksforgeeks.org",
    "https://www.geeksforgeeks.org/",
    "https://geeksforgeeks.org",
    "https://geeksforgeeks.org/",
    "https://www.w3schools.com",
    "https://www.w3schools.com/",
    "https://w3schools.com",
    "https://w3schools.com/",
    "https://nptel.ac.in",
    "https://nptel.ac.in/",
    "https://swayam.gov.in",
    "https://swayam.gov.in/",
    "https://autodesk.com",
    "https://www.autodesk.com",
    "https://www.autodesk.com/",
    "https://developer.mozilla.org",
    "https://developer.mozilla.org/",
    "https://docs.microsoft.com",
    "https://learn.microsoft.com",
  ];

  if (genericHomepages.includes(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return pathname === "" || pathname === "/";
  } catch {
    return true;
  }
}

/**
 * Multi-branch, multi-provider resource mapper for all engineering and non-engineering branches.
 * Returns 1 to 3 direct topic/course learning resource options.
 */
export function getMultipleMappedResources(
  skillOrTopic: string,
  studentBranch?: string
): MappedResource[] {
  const query = (skillOrTopic || "").toLowerCase().trim();
  const branch = (studentBranch || "").toLowerCase().trim();

  // ==========================================
  // ECE (ELECTRONICS & COMMUNICATION) SKILLS
  // ==========================================
  if (
    query.includes("digital electronics") ||
    query.includes("logic design") ||
    query.includes("logic gates") ||
    query.includes("combinational")
  ) {
    return [
      {
        title: "Digital Circuits & Logic Design Course",
        topic: "Digital Electronics",
        provider: "NPTEL",
        type: "Course",
        url: "https://nptel.ac.in/courses/108105132",
        reason: "Official NPTEL course specifically covering digital logic, flip-flops, and counters relevant for ECE core roles.",
      },
      {
        title: "Digital Electronics & Logic Design Tutorials",
        topic: "Digital Electronics",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/digital-electronics-logic-design-tutorials/",
        reason: "Step-by-step notes and practice problems for digital logic design.",
      },
    ];
  }

  if (
    query.includes("microprocessor") ||
    query.includes("microcontroller") ||
    query.includes("8085") ||
    query.includes("8086") ||
    query.includes("arm") ||
    query.includes("arduino")
  ) {
    return [
      {
        title: "Microprocessors & Microcontrollers Guide",
        topic: "Microprocessors",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/microprocessor-tutorials/",
        reason: "Covers 8085/8086 architecture, memory interfacing, and assembly routines.",
      },
      {
        title: "Microprocessors & Interfacing Course",
        topic: "Microprocessors",
        provider: "NPTEL",
        type: "Course",
        url: "https://nptel.ac.in/courses/108105102",
        reason: "Comprehensive academic module on microcontrollers and embedded interfacing.",
      },
    ];
  }

  if (
    query.includes("embedded") ||
    query.includes("firmware") ||
    query.includes("embedded c") ||
    query.includes("rtos")
  ) {
    return [
      {
        title: "Embedded Systems Development & Firmware",
        topic: "Embedded Systems",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/embedded-systems/",
        reason: "Practical guide on microcontrollers, peripheral drivers, and C programming.",
      },
      {
        title: "Embedded System Design Course",
        topic: "Embedded Systems",
        provider: "NPTEL",
        type: "Course",
        url: "https://nptel.ac.in/courses/108102045",
        reason: "Structured NPTEL series covering hardware-software co-design.",
      },
    ];
  }

  if (
    query.includes("vlsi") ||
    query.includes("cmos") ||
    query.includes("verilog") ||
    query.includes("vhdl")
  ) {
    return [
      {
        title: "VLSI Design & CMOS Technology",
        topic: "VLSI Design",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/vlsi-design-tutorials/",
        reason: "Essential CMOS logic, layout rules, and HDL simulation fundamentals.",
      },
    ];
  }

  if (
    query.includes("matlab") ||
    query.includes("simulink") ||
    query.includes("signal processing")
  ) {
    return [
      {
        title: "MATLAB Onramp Interactive Tutorial",
        topic: "MATLAB",
        provider: "MathWorks",
        type: "Course",
        url: "https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted",
        reason: "Official MathWorks interactive certification track for engineering computation.",
      },
    ];
  }

  // ==========================================
  // EEE (ELECTRICAL & ELECTRONICS) SKILLS
  // ==========================================
  if (
    query.includes("electrical machine") ||
    query.includes("transformer") ||
    query.includes("dc motor") ||
    query.includes("induction motor")
  ) {
    return [
      {
        title: "Electrical Machines & Drives Guide",
        topic: "Electrical Machines",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/electrical-machines/",
        reason: "Comprehensive concepts on DC machines, induction motors, and transformers.",
      },
      {
        title: "Electrical Machines NPTEL Course",
        topic: "Electrical Machines",
        provider: "NPTEL",
        type: "Course",
        url: "https://nptel.ac.in/courses/108105017",
        reason: "Standard university core syllabus for power and machine analysis.",
      },
    ];
  }

  if (
    query.includes("power system") ||
    query.includes("switchgear") ||
    query.includes("transmission") ||
    query.includes("grid")
  ) {
    return [
      {
        title: "Power Systems Engineering & Analysis",
        topic: "Power Systems",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/power-systems/",
        reason: "Load flow, fault analysis, and power transmission principles.",
      },
    ];
  }

  if (
    query.includes("plc") ||
    query.includes("scada") ||
    query.includes("industrial automation")
  ) {
    return [
      {
        title: "PLC Programming & SCADA Automation",
        topic: "PLC Automation",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/programmable-logic-controllers-plc/",
        reason: "Ladder logic programming and industrial control automation.",
      },
    ];
  }

  // ==========================================
  // MECHANICAL ENGINEERING SKILLS
  // ==========================================
  if (
    query.includes("autocad") ||
    query.includes("engineering drawing") ||
    query.includes("drafting")
  ) {
    return [
      {
        title: "AutoCAD Official Learning & Tutorials",
        topic: "AutoCAD",
        provider: "Autodesk Design Academy",
        type: "Tutorial",
        url: "https://www.autodesk.com/design-academy/learning-tutorials",
        reason: "Official Autodesk certification tutorials for 2D drafting and 3D design.",
      },
    ];
  }

  if (
    query.includes("solidworks") ||
    query.includes("3d cad") ||
    query.includes("catia") ||
    query.includes("creo")
  ) {
    return [
      {
        title: "SolidWorks Official Training Portal",
        topic: "SolidWorks",
        provider: "Dassault Systèmes SolidWorks",
        type: "Tutorial",
        url: "https://my.solidworks.com/training",
        reason: "Official interactive modules for part modeling, assembly, and drafting.",
      },
    ];
  }

  if (
    query.includes("thermodynamics") ||
    query.includes("heat transfer") ||
    query.includes("thermal")
  ) {
    return [
      {
        title: "Engineering Thermodynamics & Heat Transfer",
        topic: "Thermodynamics",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/engineering-thermodynamics/",
        reason: "First & second laws, power cycles, and heat exchangers.",
      },
    ];
  }

  if (
    query.includes("fluid mechanics") ||
    query.includes("hydraulics") ||
    query.includes("turbo machinery")
  ) {
    return [
      {
        title: "Fluid Mechanics & Hydraulics Tutorial",
        topic: "Fluid Mechanics",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/fluid-mechanics/",
        reason: "Fluid statics, Bernoulli equation, and pipe flow analysis.",
      },
    ];
  }

  if (
    query.includes("cnc") ||
    query.includes("manufacturing") ||
    query.includes("machining")
  ) {
    return [
      {
        title: "Manufacturing Processes & CNC Machining",
        topic: "Manufacturing",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/manufacturing-processes/",
        reason: "G-code/M-code programming, casting, and machining principles.",
      },
    ];
  }

  // ==========================================
  // CIVIL ENGINEERING SKILLS
  // ==========================================
  if (
    query.includes("surveying") ||
    query.includes("total station") ||
    query.includes("levelling")
  ) {
    return [
      {
        title: "Surveying & Levelling Principles",
        topic: "Surveying",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/surveying-in-civil-engineering/",
        reason: "Principles of chain, compass, and Total Station surveying.",
      },
    ];
  }

  if (
    query.includes("staad") ||
    query.includes("structural analysis") ||
    query.includes("revit") ||
    query.includes("bim")
  ) {
    return [
      {
        title: "STAAD.Pro Structural Analysis Learning",
        topic: "Structural Engineering",
        provider: "Bentley Systems",
        type: "Documentation",
        url: "https://www.bentley.com/software/staad/",
        reason: "Industry standard software training for structural frame analysis and design.",
      },
    ];
  }

  if (
    query.includes("concrete") ||
    query.includes("rcc") ||
    query.includes("building materials")
  ) {
    return [
      {
        title: "Concrete Technology & RCC Design",
        topic: "Concrete Technology",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/concrete-technology/",
        reason: "Mix design, IS code provisions, and reinforced concrete behavior.",
      },
    ];
  }

  // ==========================================
  // CSE / IT / WEB / SOFTWARE SKILLS
  // ==========================================
  if (query.includes("html") || query.includes("markup")) {
    return [
      {
        title: "Learn HTML",
        topic: "HTML",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/html/",
        reason: "Interactive HTML markup tutorial.",
      },
      {
        title: "HTML Web Documentation",
        topic: "HTML",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/html/",
        reason: "Detailed HTML tags and semantic structure reference.",
      },
    ];
  }

  if (query.includes("css") || query.includes("flexbox") || query.includes("grid")) {
    return [
      {
        title: "Learn CSS & Styling",
        topic: "CSS",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/css/",
        reason: "Interactive flexbox, grid, and CSS styling tutorial.",
      },
      {
        title: "CSS Layouts & Responsive Design",
        topic: "CSS",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/css/",
        reason: "Comprehensive CSS styling reference.",
      },
    ];
  }

  if (query.includes("react") || query.includes("jsx") || query.includes("redux")) {
    return [
      {
        title: "Learn React",
        topic: "React",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/react/",
        reason: "Hands-on tutorial covering components, props, and state.",
      },
      {
        title: "React.js Complete Guide",
        topic: "React",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/reactjs/",
        reason: "In-depth hooks, context, and state management guide.",
      },
    ];
  }

  if (query.includes("javascript") || query.includes("js") || query.includes("es6")) {
    return [
      {
        title: "Learn JavaScript",
        topic: "JavaScript",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/js/",
        reason: "Interactive tutorial on JS fundamentals, DOM, and ES6.",
      },
      {
        title: "JavaScript Programming Guide",
        topic: "JavaScript",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/javascript/",
        reason: "Comprehensive JS reference covering async/await, closures, and promises.",
      },
    ];
  }

  if (query.includes("python")) {
    return [
      {
        title: "Learn Python",
        topic: "Python",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/python/",
        reason: "Beginner to advanced Python syntax and data structures.",
      },
      {
        title: "Python Programming Language Tutorial",
        topic: "Python",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/python/",
        reason: "Detailed Python tutorial with code execution and practice.",
      },
    ];
  }

  if (query.includes("node") || query.includes("express")) {
    return [
      {
        title: "Learn Node.js",
        topic: "Node.js",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/nodejs/",
        reason: "Server-side JavaScript and event-driven architecture.",
      },
      {
        title: "Node.js Backend Tutorial",
        topic: "Node.js",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/nodejs/",
        reason: "Express API routes, middleware, and database integration.",
      },
    ];
  }

  if (query.includes("c++") || query.includes("cpp")) {
    return [
      {
        title: "Learn C++",
        topic: "C++",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/c-plus-plus/",
        reason: "OOPs concepts, STL, and memory management in C++.",
      },
      {
        title: "C++ Tutorial",
        topic: "C++",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/cpp/",
        reason: "Interactive C++ syntax and object-oriented exercises.",
      },
    ];
  }

  if (query.includes("java") && !query.includes("javascript")) {
    return [
      {
        title: "Learn Java",
        topic: "Java",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/java/",
        reason: "Core Java, Multithreading, OOPs, and Collections Framework.",
      },
      {
        title: "Java Tutorial",
        topic: "W3Schools",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/java/",
        reason: "Step-by-step Java programming tutorial.",
      },
    ];
  }

  if (query.includes("sql") || query.includes("database") || query.includes("mysql")) {
    return [
      {
        title: "Learn SQL & Databases",
        topic: "SQL",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/sql/",
        reason: "Interactive SQL query builder and database management.",
      },
      {
        title: "SQL Tutorial & Database Design",
        topic: "SQL",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/sql/",
        reason: "Database normalization, indexing, and complex joins.",
      },
    ];
  }

  if (
    query.includes("dsa") ||
    query.includes("data structure") ||
    query.includes("algorithm") ||
    query.includes("trees") ||
    query.includes("sorting")
  ) {
    return [
      {
        title: "Data Structures & Algorithms Hub",
        topic: "Data Structures",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/data-structures/",
        reason: "Definitive DSA learning path for technical interview preparation.",
      },
      {
        title: "Learn DSA",
        topic: "Data Structures",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/dsa/",
        reason: "Visual algorithm walkthroughs and code implementations.",
      },
    ];
  }

  if (query.includes("git") || query.includes("github")) {
    return [
      {
        title: "Learn Git & GitHub",
        topic: "Git",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/git/",
        reason: "Version control, branching strategies, and pull requests.",
      },
      {
        title: "Git & Version Control Guide",
        topic: "Git",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/git/",
        reason: "Git commands, merge conflict resolution, and workflows.",
      },
    ];
  }

  if (query.includes("data science") || query.includes("pandas")) {
    return [
      {
        title: "Learn Data Science",
        topic: "Data Science",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/datascience/",
        reason: "Data cleaning, Pandas, NumPy, and statistical analysis.",
      },
      {
        title: "Data Science Tutorial",
        topic: "Data Science",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/data-science/",
        reason: "Comprehensive data science workflow and exploratory data analysis.",
      },
    ];
  }

  if (query.includes("machine learning") || query.includes("ml")) {
    return [
      {
        title: "Machine Learning Getting Started Guide",
        topic: "Machine Learning",
        provider: "W3Schools",
        type: "Tutorial",
        url: "https://www.w3schools.com/python/python_ml_getting_started.asp",
        reason: "Supervised and unsupervised learning with Python and Scikit-Learn.",
      },
      {
        title: "Machine Learning Tutorial",
        topic: "Machine Learning",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/machine-learning/",
        reason: "Model evaluation, feature engineering, and neural network basics.",
      },
    ];
  }

  // ==========================================
  // BRANCH DEFAULT FALLBACK (NON-GENERIC)
  // ==========================================
  if (branch.includes("ece") || branch.includes("electronics")) {
    return [
      {
        title: "Digital Electronics & Logic Design",
        topic: "Digital Electronics",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/digital-electronics-logic-design-tutorials/",
        reason: "Essential digital electronics and circuit fundamentals for ECE students.",
      },
    ];
  }

  if (branch.includes("eee") || branch.includes("electrical")) {
    return [
      {
        title: "Electrical Machines & Power Fundamentals",
        topic: "Electrical Engineering",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/electrical-machines/",
        reason: "Core electrical machines and power systems tutorial for EEE students.",
      },
    ];
  }

  if (branch.includes("mech") || branch.includes("mechanical")) {
    return [
      {
        title: "AutoCAD & Engineering CAD Tutorials",
        topic: "CAD & Design",
        provider: "Autodesk Design Academy",
        type: "Tutorial",
        url: "https://www.autodesk.com/design-academy/learning-tutorials",
        reason: "Official Autodesk CAD and technical drafting tutorials for Mechanical engineers.",
      },
    ];
  }

  if (branch.includes("civil")) {
    return [
      {
        title: "Surveying & Civil Engineering Fundamentals",
        topic: "Civil Engineering",
        provider: "GeeksforGeeks",
        type: "Tutorial",
        url: "https://www.geeksforgeeks.org/surveying-in-civil-engineering/",
        reason: "Core civil engineering surveying and structural principles.",
      },
    ];
  }

  // Fallback default
  return [
    {
      title: `Learn ${skillOrTopic || "Core Concepts"}`,
      topic: skillOrTopic || "Technical Skills",
      provider: "GeeksforGeeks",
      type: "Tutorial",
      url: "https://www.geeksforgeeks.org/data-structures/",
      reason: `Direct resource for ${skillOrTopic || "Core Engineering"}.`,
    },
  ];
}

/**
 * Maps a single primary resource (compatibility helper).
 */
export function getMappedResource(
  skillOrTopic: string,
  preferredProvider?: string,
  studentBranch?: string
): MappedResource {
  const list = getMultipleMappedResources(skillOrTopic, studentBranch);
  if (preferredProvider) {
    const matched = list.find(
      (r) => r.provider.toLowerCase() === preferredProvider.toLowerCase()
    );
    if (matched) return matched;
  }
  return list[0];
}
