import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Percent,
  Variable,
  Shapes,
  BookOpen,
  FileText,
  SpellCheck,
  Dna,
  FlaskConical,
  Zap,
  Globe,
  Code2,
  Brain,
  Coins,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Award,
  BookMarked,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Check,
  RotateCcw,
  ChevronRight,
  Layers,
  GraduationCap,
  Target,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface SubjectTopic {
  id: string;
  name: string;
  skillTag: string;
  description: string;
  estimatedMinutes: number;
  difficultyLevel: number;
  priorityLabel?: string;
}

export interface SubjectLearningPoint {
  title: string;
  description: string;
}

export type SubjectCategoryGroup =
  | 'All'
  | 'Mathematics'
  | 'Language Arts'
  | 'Science'
  | 'Technology & Logic'
  | 'Life Skills';

export interface SubjectCategory {
  id: string;
  name: string;
  categoryGroup: Exclude<SubjectCategoryGroup, 'All'>;
  tagline: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  heroBg: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  openStaxAttribution?: {
    title: string;
    license: string;
    url: string;
  };
  whatYoullLearn: SubjectLearningPoint[];
  whoItsFor: string;
  beforeYouStart: string[];
  topics: SubjectTopic[];
}

export const SUBJECT_CATALOG: SubjectCategory[] = [
  // --- Mathematics ---
  {
    id: 'math',
    name: 'Arithmetic & Number Sense',
    categoryGroup: 'Mathematics',
    tagline: 'Multi-digit operations, estimation heuristics & mental number lines',
    description: 'Build rock-solid fluency in whole number operations, place value decomposition, and word problem breakdown.',
    icon: Calculator,
    gradient: 'from-blue-600 to-cyan-600',
    heroBg: 'bg-[#153229]',
    badge: 'Foundational Math',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    whatYoullLearn: [
      {
        title: 'Multi-Digit Arithmetic Precision',
        description: 'Add, subtract, multiply, and divide whole numbers using place value decomposition and regrouping.',
      },
      {
        title: 'Estimation & Friendly Numbers',
        description: 'Use friendly rounding, compensation, and mental benchmark strategies to verify reasonableness.',
      },
      {
        title: 'Visual Number Line Navigation',
        description: 'Skip-count, jump by powers of ten, and visualize numeric magnitudes on structured number lines.',
      },
      {
        title: 'Word Problem Decomposition',
        description: 'Translate multi-sentence real-world prompts into step-by-step mathematical expressions without overwhelm.',
      },
    ],
    whoItsFor: 'Learners strengthening calculation confidence, mental math fluency, and structured word-problem problem-solving.',
    beforeYouStart: [
      'Basic single-digit addition and multiplication facts (0-9)',
      'Understanding of place value columns (ones, tens, hundreds)',
    ],
    topics: [
      {
        id: 'math_ops',
        name: 'Whole Number Operations & Estimation',
        skillTag: 'operations',
        description: 'Multi-digit addition, subtraction, multiplication, division, and rounding strategies.',
        estimatedMinutes: 5,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Foundations',
      },
      {
        id: 'math_mental',
        name: 'Mental Math & Number Line Navigation',
        skillTag: 'mental_math',
        description: 'Skip counting, friendly number grouping, and visual number line calculations.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Mental Fluency',
      },
      {
        id: 'math_word',
        name: 'Word Problem Decomposition',
        skillTag: 'word_problems',
        description: 'Translating real-world scenario prompts into step-by-step mathematical expressions.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Applied Reasoning',
      },
    ],
  },
  {
    id: 'fractions',
    name: 'Fractions, Decimals & Percentages',
    categoryGroup: 'Mathematics',
    tagline: 'Partitioning models, decimal equivalence & real-world percentage rates',
    description: 'Master fraction equivalence, decimal conversions, ratio reasoning, and percentage calculations.',
    icon: Percent,
    gradient: 'from-indigo-600 to-sky-600',
    heroBg: 'bg-[#1b2b3a]',
    badge: 'Visual Math',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    whatYoullLearn: [
      {
        title: 'Visual Parts of Wholes',
        description: 'Partition circle and bar models to visualize equivalent fractions and common denominators.',
      },
      {
        title: 'Decimal & Fraction Conversion',
        description: 'Seamlessly convert between tenths, hundredths, thousandths, and rational fraction forms.',
      },
      {
        title: 'Rates & Proportion Reasoning',
        description: 'Calculate real-world sales discounts, taxes, tips, and benchmark proportions (25%, 50%, 75%).',
      },
      {
        title: 'Mixed Numbers & Scaling',
        description: 'Compare unequal fractions using cross-multiplication, common multiples, and visual scaling.',
      },
    ],
    whoItsFor: 'Students transitioning from whole numbers to rational numbers, proportional thinking, and practical financial math.',
    beforeYouStart: [
      'Basic whole number division and multiplication fluency',
      'Familiarity with visual pie charts and number lines',
    ],
    topics: [
      {
        id: 'frac_parts',
        name: 'Equivalent Fractions & Visual Parts',
        skillTag: 'fractions',
        description: 'Partitioning visual models, simplifying fractions, and finding common denominators.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Visual Equivalence',
      },
      {
        id: 'frac_decimals',
        name: 'Decimals & Place Value Conversion',
        skillTag: 'decimals',
        description: 'Tenths, hundredths, thousandths conversions and decimal arithmetic.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Decimal Systems',
      },
      {
        id: 'frac_percents',
        name: 'Percentages, Discounts & Ratios',
        skillTag: 'percentages',
        description: 'Calculating discounts, sales tax, proportions, and benchmark percentages.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Applied Percentages',
      },
    ],
  },
  {
    id: 'algebra',
    name: 'Pre-Algebra & Equations',
    categoryGroup: 'Mathematics',
    tagline: 'Variables, inverse balance scale operations & inequality graphing',
    description: 'Solve one-step and two-step equations, balance algebraic scales, and graph linear inequalities.',
    icon: Variable,
    gradient: 'from-violet-600 to-purple-700',
    heroBg: 'bg-[#211b33]',
    badge: 'Core Algebra',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-800',
    whatYoullLearn: [
      {
        title: 'Isolate Unknown Variables',
        description: 'Solve linear equations using inverse operations and balance scale equality rules.',
      },
      {
        title: 'Evaluate Expression Formulas',
        description: 'Substitute values into multi-term algebraic expressions adhering to PEMDAS order of operations.',
      },
      {
        title: 'Graph Inequalities on Number Lines',
        description: 'Determine open/closed boundary conditions and plot solutions for single-variable inequalities.',
      },
      {
        title: 'Model Algebraic Scenarios',
        description: 'Write algebraic equations from English prompts to solve for mystery numbers and changing rates.',
      },
    ],
    whoItsFor: 'Middle-grade and upper elementary learners advancing into algebraic thinking, abstract logic, and equations.',
    beforeYouStart: [
      'Fluency with standard arithmetic operations (+, -, ×, ÷)',
      'Comfort with negative integers and parentheses',
    ],
    topics: [
      {
        id: 'alg_linear',
        name: 'One-Step Linear Equations',
        skillTag: 'algebra',
        description: 'Isolating unknown variables using inverse operations and balance methods.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Linear Balance',
      },
      {
        id: 'alg_expressions',
        name: 'Variable Substitution & Evaluation',
        skillTag: 'expressions',
        description: 'Evaluating algebraic expressions with order of operations (PEMDAS).',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Formula Evaluation',
      },
      {
        id: 'alg_inequalities',
        name: 'Inequalities & Graphing',
        skillTag: 'inequalities',
        description: 'Solving inequalities and plotting solution sets on number lines.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Inequality Bounds',
      },
    ],
  },
  {
    id: 'geometry',
    name: 'Geometry & Spatial Reasoning',
    categoryGroup: 'Mathematics',
    tagline: 'Perimeter, polygon classifications, 2D/3D area & coordinate grid plotting',
    description: 'Explore geometric properties, polygon classifications, angle relationships, and coordinate grids.',
    icon: Shapes,
    gradient: 'from-teal-600 to-emerald-700',
    heroBg: 'bg-[#12312d]',
    badge: 'Spatial Reasoning',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    whatYoullLearn: [
      {
        title: 'Perimeter & 2D Area Computation',
        description: 'Calculate boundary lengths and surface areas for rectangles, triangles, and composite polygons.',
      },
      {
        title: 'Polygon & Angle Classification',
        description: 'Differentiate quadrilaterals, triangles by acute/right/obtuse angles, and 3D geometric prisms.',
      },
      {
        title: 'Spatial Coordinates & Transformations',
        description: 'Plot (x, y) coordinates, calculate grid distance, and observe translations and reflections.',
      },
      {
        title: 'Visual Scale & Symmetry',
        description: 'Analyze lines of symmetry, geometric tessellations, and scaled dimensional drawings.',
      },
    ],
    whoItsFor: 'Spatial thinkers interested in architecture, shapes, dimensional measurement, and coordinate mapping.',
    beforeYouStart: [
      'Basic ruler and unit measurements (cm, inches, square units)',
      'Basic multiplication for area formulas',
    ],
    topics: [
      {
        id: 'geom_formulas',
        name: 'Perimeter & Area Formulas',
        skillTag: 'geometry',
        description: 'Calculating boundary lengths and surface areas for rectangles, triangles, and composite shapes.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Area & Perimeter',
      },
      {
        id: 'geom_shapes',
        name: '2D & 3D Shapes & Angles',
        skillTag: 'shapes_angles',
        description: 'Classifying quadrilaterals, triangles by angles, and identifying 3D prisms and pyramids.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Shape Classification',
      },
      {
        id: 'geom_coordinates',
        name: 'Spatial Coordinate Grids & Transformations',
        skillTag: 'coordinate_grids',
        description: 'Plotting (x, y) coordinates, reflections, translations, and grid distance.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Coordinate Systems',
      },
    ],
  },

  // --- Language Arts ---
  {
    id: 'reading',
    name: 'Reading Comprehension',
    categoryGroup: 'Language Arts',
    tagline: 'Main idea extraction, text evidence inferences & organizational structures',
    description: 'Develop critical reading skills, author intent analysis, textual evidence citation, and summaries.',
    icon: BookOpen,
    gradient: 'from-amber-600 to-orange-600',
    heroBg: 'bg-[#312211]',
    badge: 'Literacy Core',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    whatYoullLearn: [
      {
        title: 'Identify Central Themes & Main Ideas',
        description: 'Extract core thesis statements, topic sentences, and distinguish vital facts from supporting fluff.',
      },
      {
        title: 'Text-Based Inference Deduction',
        description: 'Read between the lines using neighboring context clues to deduce unspoken author meaning.',
      },
      {
        title: 'Analyze Informational Text Structures',
        description: 'Recognize chronological, cause-effect, compare-contrast, and problem-solution passage flows.',
      },
      {
        title: 'Synthesize Concise Summaries',
        description: 'Condense multi-paragraph narrative and expository texts into clear, memorable takeaways.',
      },
    ],
    whoItsFor: 'Readers developing deeper reading comprehension, active note-taking, and factual retention.',
    beforeYouStart: [
      'Ability to read multi-sentence paragraphs comfortably',
      'Familiarity with identifying basic story elements (character, setting, plot)',
    ],
    topics: [
      {
        id: 'read_main_idea',
        name: 'Main Idea & Supporting Details',
        skillTag: 'main_idea',
        description: 'Identifying central themes, topic sentences, and distinguishing key facts from fluff.',
        estimatedMinutes: 5,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Core Theme',
      },
      {
        id: 'read_context_clues',
        name: 'Context Clues & Inferences',
        skillTag: 'inference',
        description: 'Reading between the lines and using neighboring sentence clues to infer meaning.',
        estimatedMinutes: 6,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Deep Inference',
      },
      {
        id: 'read_structure',
        name: 'Story Structure & Summarizing',
        skillTag: 'text_structure',
        description: 'Analyzing plot arcs, problem-solution text structures, and synthesizing chapter summaries.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Text Synthesis',
      },
    ],
  },
  {
    id: 'grammar',
    name: 'Grammar & Sentence Mechanics',
    categoryGroup: 'Language Arts',
    tagline: '8 parts of speech, punctuation rules & compound sentence synthesis',
    description: 'Master parts of speech, punctuation rules, capitalization, and sentence combining.',
    icon: FileText,
    gradient: 'from-rose-600 to-pink-600',
    heroBg: 'bg-[#331622]',
    badge: 'Writing Mechanics',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    whatYoullLearn: [
      {
        title: 'Identify Parts of Speech',
        description: 'Classify nouns, verbs, adjectives, adverbs, prepositions, and conjunctions in live context.',
      },
      {
        title: 'Punctuation & Capitalization Rules',
        description: 'Apply commas in series, apostrophes for possession/contractions, and dialogue quotation marks.',
      },
      {
        title: 'Fix Run-Ons & Sentence Fragments',
        description: 'Distinguish dependent and independent clauses and link them with coordinating conjunctions.',
      },
      {
        title: 'Craft Dynamic Sentence Variety',
        description: 'Combine short sentences into rich compound and complex structures with active voice.',
      },
    ],
    whoItsFor: 'Students looking to polish written communication, punctuation accuracy, and sentence variety.',
    beforeYouStart: [
      'Basic knowledge of simple sentences (subject + verb)',
      'Understanding of uppercase letters and ending punctuation',
    ],
    topics: [
      {
        id: 'gram_parts_of_speech',
        name: 'Parts of Speech Identification',
        skillTag: 'parts_of_speech',
        description: 'Identifying nouns, verbs, adjectives, adverbs, prepositions, and conjunctions in action.',
        estimatedMinutes: 4,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Parts of Speech',
      },
      {
        id: 'gram_punctuation',
        name: 'Punctuation & Capitalization Rules',
        skillTag: 'punctuation',
        description: 'Commas in series, apostrophes for possession, quotation marks, and proper noun capitalization.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Mechanics & Commas',
      },
      {
        id: 'gram_combining',
        name: 'Sentence Combining & Clauses',
        skillTag: 'sentence_structure',
        description: 'Fixing run-ons and fragments, crafting compound and complex sentences with conjunctions.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Complex Clauses',
      },
    ],
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary & Word Study',
    categoryGroup: 'Language Arts',
    tagline: 'Greek/Latin roots, prefix/suffix decoding & contextual shades of meaning',
    description: 'Expand word power using Greek/Latin roots, prefix/suffix morphology, and subtle word connotations.',
    icon: SpellCheck,
    gradient: 'from-fuchsia-600 to-purple-600',
    heroBg: 'bg-[#2d1433]',
    badge: 'Morphology',
    badgeBg: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-800',
    whatYoullLearn: [
      {
        title: 'Decode Affixes & Root Words',
        description: 'Unlock multi-syllable terms using common Greek/Latin roots, prefixes, and suffixes.',
      },
      {
        title: 'Nuanced Synonym & Antonym Relationships',
        description: 'Compare shades of meaning, antonym pairs, and context-dependent word connotations.',
      },
      {
        title: 'High-Utility Academic Vocabulary',
        description: 'Master tier-2 academic words that frequently appear across science and social studies curricula.',
      },
      {
        title: 'Interpret Figurative Expressions',
        description: 'Decode idioms, metaphors, similes, and hyperbole embedded in reading passages.',
      },
    ],
    whoItsFor: 'Learners expanding their vocabulary bank, spelling retention, and descriptive speaking skills.',
    beforeYouStart: [
      'Basic grade-level reading vocabulary',
      'Comfort with looking up definitions and synonyms',
    ],
    topics: [
      {
        id: 'vocab_affixes',
        name: 'Prefixes, Suffixes & Root Words',
        skillTag: 'morphology',
        description: 'Decoding unfamiliar multi-syllable words using base roots and common affixes.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Root Decoding',
      },
      {
        id: 'vocab_synonyms',
        name: 'Synonyms, Antonyms & Nuances',
        skillTag: 'word_relationships',
        description: 'Comparing shades of meaning, antonym pairs, and figurative language expressions.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Nuance & Context',
      },
      {
        id: 'vocab_academic',
        name: 'Academic & Domain Vocabulary',
        skillTag: 'academic_vocab',
        description: 'Mastering high-utility tier 2 and tier 3 academic terms across subjects.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Academic Terms',
      },
    ],
  },

  // --- Science ---
  {
    id: 'biology',
    name: 'Life Science & Biology',
    categoryGroup: 'Science',
    tagline: 'Organelles, photosynthesis cycles, ATP cellular respiration & Punnett square genetics',
    description: 'Grounded in OpenStax Concepts of Biology. Explore organelles, photosynthesis, DNA, and ecosystems.',
    icon: Dna,
    gradient: 'from-green-600 to-emerald-700',
    heroBg: 'bg-[#122e23]',
    badge: 'OpenStax Grounded',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    openStaxAttribution: {
      title: 'OpenStax Concepts of Biology',
      license: 'CC BY 4.0 License',
      url: 'https://openstax.org/details/books/concepts-biology',
    },
    whatYoullLearn: [
      {
        title: 'Cellular Anatomy & Organelle Roles',
        description: 'Compare plant and animal cells, rigid cell walls, plasma membranes, and ATP mitochondria.',
      },
      {
        title: 'Photosynthesis Chemical Reactions',
        description: 'Follow chloroplast chlorophyll absorption, light reactions, and Calvin cycle glucose synthesis.',
      },
      {
        title: 'Cellular Respiration Pathways',
        description: 'Track how aerobic respiration in mitochondria turns glucose into cellular energy (ATP).',
      },
      {
        title: 'Mendelian Genetics & Punnett Grids',
        description: 'Predict allele inheritance probabilities, dominant/recessive traits, and DNA double-helix structures.',
      },
    ],
    whoItsFor: 'Students exploring living organisms, cellular biology, genetics, and ecology grounded in OpenStax.',
    beforeYouStart: [
      'Basic awareness that all living organisms are composed of microscopic cells',
      'Familiarity with plant sunlight and food consumption concepts',
    ],
    topics: [
      {
        id: 'cell_structure',
        name: 'Cell Structure & Organelles',
        skillTag: 'cell_biology',
        description: 'Plant vs. animal cells, rigid cell walls, plasma membranes, organelles, and ATP production.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Cell Structure',
      },
      {
        id: 'photosynthesis',
        name: 'Photosynthesis & Cellular Respiration',
        skillTag: 'photosynthesis',
        description: 'Chloroplasts, chlorophyll, light-dependent reactions, and cellular respiration.',
        estimatedMinutes: 6,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Energy Cycles',
      },
      {
        id: 'genetics_dna',
        name: 'Genetics & DNA Inheritance',
        skillTag: 'genetics',
        description: 'DNA double-helix structure, dominant/recessive genes, and Punnett square inheritance.',
        estimatedMinutes: 7,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Genetic Inheritance',
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry & Matter',
    categoryGroup: 'Science',
    tagline: 'Atomic subparticles, physical phase transitions & reaction conservation laws',
    description: 'Explore atomic structure, the periodic table, chemical bonds, and phase changes.',
    icon: FlaskConical,
    gradient: 'from-amber-500 to-red-600',
    heroBg: 'bg-[#311a14]',
    badge: 'Physical Science',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    whatYoullLearn: [
      {
        title: 'Subatomic Particles & Periodic Elements',
        description: 'Understand protons, neutrons, electrons, atomic numbers, and periodic table organization.',
      },
      {
        title: 'States of Matter & Thermal Kinetic Energy',
        description: 'Model molecular motion during melting, freezing, evaporation, and condensation.',
      },
      {
        title: 'Evidence of Chemical Reactions',
        description: 'Differentiate physical mixtures from chemical bonds, identifying gas, heat, and color changes.',
      },
      {
        title: 'Law of Conservation of Mass',
        description: 'Verify that atoms are rearranged rather than created or destroyed in chemical equations.',
      },
    ],
    whoItsFor: 'Curious learners exploring matter, atoms, molecules, chemical changes, and laboratory science.',
    beforeYouStart: [
      'Understanding of three basic states of matter (solids, liquids, gases)',
      'Basic metric measurement concepts',
    ],
    topics: [
      {
        id: 'chem_atoms',
        name: 'Atoms & Periodic Elements',
        skillTag: 'atomic_structure',
        description: 'Protons, neutrons, electrons, atomic number, and periodic table organization.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Atomic Building Blocks',
      },
      {
        id: 'chem_states',
        name: 'States of Matter & Phase Change',
        skillTag: 'states_of_matter',
        description: 'Solids, liquids, gases, melting, freezing, evaporation, and thermal kinetic energy.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Phase Transitions',
      },
      {
        id: 'chem_reactions',
        name: 'Chemical Reactions & Balancing',
        skillTag: 'chemical_reactions',
        description: 'Reactants and products, evidence of chemical change, and conservation of mass.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Reaction Laws',
      },
    ],
  },
  {
    id: 'physics',
    name: 'Physics & Forces',
    categoryGroup: 'Science',
    tagline: 'Velocity kinematics, Newton’s three laws of motion & kinetic/potential energy conservation',
    description: 'Master Newton’s laws of motion, speed and acceleration, simple machines, and energy forms.',
    icon: Zap,
    gradient: 'from-yellow-500 to-amber-600',
    heroBg: 'bg-[#2e2612]',
    badge: 'Forces & Energy',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    whatYoullLearn: [
      {
        title: 'Speed, Velocity & Acceleration',
        description: 'Plot distance-time graphs and compute speed using the formula distance divided by time.',
      },
      {
        title: 'Newton’s Three Laws of Motion',
        description: 'Master inertia, force equations (F = ma), and action-reaction pairs with real-world examples.',
      },
      {
        title: 'Conservation of Mechanical Energy',
        description: 'Track conversions between gravitational potential energy and kinetic energy on tracks.',
      },
      {
        title: 'Friction & Gravitational Forces',
        description: 'Analyze how surface resistance, mass, and gravitational acceleration influence moving bodies.',
      },
    ],
    whoItsFor: 'Students fascinated by motion, gravity, vehicles, roller coasters, and the physical universe.',
    beforeYouStart: [
      'Basic arithmetic substitution into formula equations',
      'Understanding of standard distance and time units',
    ],
    topics: [
      {
        id: 'phys_motion',
        name: 'Motion, Speed & Acceleration',
        skillTag: 'motion',
        description: 'Distance vs. time graphs, calculating speed (d/t), and understanding velocity changes.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Kinematics & Speed',
      },
      {
        id: 'phys_newton',
        name: 'Newton’s Laws of Motion',
        skillTag: 'newtons_laws',
        description: 'Inertia, F=ma calculation, action-reaction pairs, and friction forces.',
        estimatedMinutes: 5,
        difficultyLevel: 3,
        priorityLabel: 'Priority 2 • Step 2: Dynamics & Forces',
      },
      {
        id: 'phys_energy',
        name: 'Kinetic & Potential Energy',
        skillTag: 'energy_conservation',
        description: 'Energy transformations, roller coaster physics, and conservation of mechanical energy.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Energy Conservation',
      },
    ],
  },
  {
    id: 'earth_space',
    name: 'Earth & Space Science',
    categoryGroup: 'Science',
    tagline: 'Solar planetary systems, tectonic crust layers & atmospheric precipitation cycles',
    description: 'Investigate our solar system, rock cycles, plate tectonics, weather patterns, and the water cycle.',
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-600',
    heroBg: 'bg-[#122e2a]',
    badge: 'Earth Science',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    whatYoullLearn: [
      {
        title: 'Solar System Planetary Astronomy',
        description: 'Compare inner terrestrial planets, gas giants, moon phases, and gravitational orbits.',
      },
      {
        title: 'Earth Crust & Plate Tectonics',
        description: 'Understand crust, mantle, core, continental drift, earthquake faults, and volcano formation.',
      },
      {
        title: 'Hydrologic Water Cycle Stages',
        description: 'Trace evaporation, condensation, precipitation, transpiration, and cloud formations.',
      },
      {
        title: 'Atmospheric Weather Systems',
        description: 'Read barometric air pressure systems, weather fronts, wind currents, and global climates.',
      },
    ],
    whoItsFor: 'Learners fascinated by planetary science, outer space, geology, weather systems, and the oceans.',
    beforeYouStart: [
      'General knowledge of planets and seasons on Earth',
      'Understanding of liquid water, vapor, and ice states',
    ],
    topics: [
      {
        id: 'space_solar_system',
        name: 'Solar System & Planetary Motion',
        skillTag: 'solar_system',
        description: 'Inner rocky vs. outer gas planets, moon phases, orbits, and gravity.',
        estimatedMinutes: 5,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Solar Planetary Space',
      },
      {
        id: 'earth_layers',
        name: 'Earth Layers & Plate Tectonics',
        skillTag: 'earth_layers',
        description: 'Crust, mantle, core, continental drift, earthquakes, and volcano formation.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Geology & Crust',
      },
      {
        id: 'earth_weather',
        name: 'Weather Systems & The Water Cycle',
        skillTag: 'weather_water_cycle',
        description: 'Evaporation, condensation, precipitation, cloud types, and atmospheric air pressure.',
        estimatedMinutes: 6,
        difficultyLevel: 2,
        priorityLabel: 'Priority 3 • Step 3: Weather Cycles',
      },
    ],
  },

  // --- Technology & Logic ---
  {
    id: 'cs',
    name: 'Computer Science & Coding',
    categoryGroup: 'Technology & Logic',
    tagline: 'Algorithmic flowcharts, logic gate conditions & step-by-step program debugging',
    description: 'Learn step-by-step computational thinking, pattern recognition, loops, and debugging code.',
    icon: Code2,
    gradient: 'from-purple-600 to-pink-700',
    heroBg: 'bg-[#291333]',
    badge: 'Code & Logic',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    whatYoullLearn: [
      {
        title: 'Algorithmic Thinking & Step Sequencing',
        description: 'Structure precise step-by-step pseudo-code instructions, decision branches, and flowcharts.',
      },
      {
        title: 'Loops, Conditionals & Boolean Logic',
        description: 'Implement if-then conditionals, while/for loops, and boolean logic gates (AND, OR, NOT).',
      },
      {
        title: 'Code Tracing & Bug Fixing',
        description: 'Trace variable states line-by-line to isolate syntax bugs and logical execution errors.',
      },
      {
        title: 'Modular Decompositions',
        description: 'Break monolithic coding problems into reusable helper functions and modular routines.',
      },
    ],
    whoItsFor: 'Aspiring programmers, problem solvers, and students developing structured computational logic.',
    beforeYouStart: [
      'Basic keyboard and computer navigation skills',
      'Comfort with following step-by-step instructions',
    ],
    topics: [
      {
        id: 'cs_algorithms',
        name: 'Algorithms & Step Sequencing',
        skillTag: 'algorithms',
        description: 'Writing precise step-by-step instructions, flowcharts, and pseudo-code routines.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 1 • Step 1: Algorithms',
      },
      {
        id: 'cs_logic',
        name: 'Loops, Conditionals & Logic',
        skillTag: 'conditionals_loops',
        description: 'If-then decision branches, repeat loops, and boolean logic gates (AND, OR, NOT).',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Conditionals & Loops',
      },
      {
        id: 'cs_debugging',
        name: 'Code Tracing & Debugging',
        skillTag: 'debugging',
        description: 'Finding syntax and logic errors, tracking variable states, and fixing program bugs.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Debugging & Tracing',
      },
    ],
  },
  {
    id: 'logic',
    name: 'Logic & Executive Function',
    categoryGroup: 'Technology & Logic',
    tagline: 'Matrix pattern deduction, multi-step goal decomposition & structured premise reasoning',
    description: 'Strengthen working memory, spatial deduction, structured planning, and multi-step reasoning.',
    icon: Brain,
    gradient: 'from-teal-600 to-indigo-700',
    heroBg: 'bg-[#152a35]',
    badge: 'Cognitive Skills',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    whatYoullLearn: [
      {
        title: 'Matrix Pattern Recognition',
        description: 'Identify visual progression rules, numerical progressions, and rotational geometric sequences.',
      },
      {
        title: 'Multi-Step Goal Decomposition',
        description: 'Break overwhelming, large-scale projects into prioritized, bite-sized, actionable milestones.',
      },
      {
        title: 'Deductive Reasoning & Elimination',
        description: 'Solve grid logic puzzles and test premises to reach rock-solid, verifiable conclusions.',
      },
      {
        title: 'Executive Working Memory Practice',
        description: 'Strengthen working memory, attentional focus, and cognitive flexibility with structured prompts.',
      },
    ],
    whoItsFor: 'Neurodivergent learners seeking structured executive functioning, working memory tools, and cognitive confidence.',
    beforeYouStart: [
      'No prerequisites required — designed for self-paced, confidence-boosting practice',
    ],
    topics: [
      {
        id: 'logic_patterns',
        name: 'Pattern Recognition & Sequences',
        skillTag: 'pattern_recognition',
        description: 'Identifying visual matrix rules, numerical sequences, and geometric progressions.',
        estimatedMinutes: 4,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Pattern Sequences',
      },
      {
        id: 'logic_decomposition',
        name: 'Multi-Step Task Decomposition',
        skillTag: 'task_decomposition',
        description: 'Breaking large complex goals into manageable, prioritized sub-tasks.',
        estimatedMinutes: 6,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Task Decomposition',
      },
      {
        id: 'logic_deduction',
        name: 'Deductive Reasoning Puzzles',
        skillTag: 'deductive_reasoning',
        description: 'Grid logic puzzles, elimination rules, and drawing valid conclusions from premises.',
        estimatedMinutes: 6,
        difficultyLevel: 3,
        priorityLabel: 'Priority 3 • Step 3: Deductive Puzzles',
      },
    ],
  },

  // --- Life Skills ---
  {
    id: 'finance',
    name: 'Financial Literacy & Practical Math',
    categoryGroup: 'Life Skills',
    tagline: 'Currency counting, 50/30/20 balanced budgeting & smart consumer decision-making',
    description: 'Learn real-world money management, coin and bill counting, budgeting, and saving strategies.',
    icon: Coins,
    gradient: 'from-emerald-600 to-green-700',
    heroBg: 'bg-[#142e20]',
    badge: 'Practical Life',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    whatYoullLearn: [
      {
        title: 'Currency Calculation & Exact Change',
        description: 'Count bill denominations, coin values, and calculate accurate change at store checkouts.',
      },
      {
        title: '50/30/20 Budgeting Principles',
        description: 'Allocate income effectively across core needs, personal wants, and emergency savings goals.',
      },
      {
        title: 'Smart Consumer Decision-Making',
        description: 'Differentiate needs from wants, resist impulse buying, and compare unit prices in stores.',
      },
      {
        title: 'Long-Term Savings & Interest Growth',
        description: 'Understand how interest accrues and how regular savings build financial security over time.',
      },
    ],
    whoItsFor: 'Students developing real-world life math, financial independence, budgeting, and practical money confidence.',
    beforeYouStart: [
      'Basic decimal arithmetic with dollars and cents ($0.00)',
      'Understanding of basic currency values',
    ],
    topics: [
      {
        id: 'fin_currency',
        name: 'Coins, Currency & Making Change',
        skillTag: 'currency_calculation',
        description: 'Counting bill combinations, coin values, and calculating change at checkout.',
        estimatedMinutes: 5,
        difficultyLevel: 1,
        priorityLabel: 'Priority 1 • Step 1: Currency Fluency',
      },
      {
        id: 'fin_budgeting',
        name: 'Budgeting & Saving Strategies',
        skillTag: 'budgeting',
        description: 'Allocating income across buckets, setting savings goals, and emergency funds.',
        estimatedMinutes: 5,
        difficultyLevel: 2,
        priorityLabel: 'Priority 2 • Step 2: Budgeting Models',
      },
      {
        id: 'fin_spending',
        name: 'Needs vs. Wants & Smart Shopping',
        skillTag: 'smart_spending',
        description: 'Comparing unit prices, prioritizing essentials, and resisting impulse buying.',
        estimatedMinutes: 6,
        difficultyLevel: 2,
        priorityLabel: 'Priority 3 • Step 3: Smart Spending',
      },
    ],
  },
];

const CATEGORY_GROUPS: SubjectCategoryGroup[] = [
  'All',
  'Mathematics',
  'Language Arts',
  'Science',
  'Technology & Logic',
  'Life Skills',
];

interface SubjectSelectionHubProps {
  onSelectTopic: (subject: string, skillTag: string) => void;
}

export const SubjectSelectionHub: React.FC<SubjectSelectionHubProps> = ({ onSelectTopic }) => {
  const { profile } = useAuth();
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<SubjectCategory | null>(null);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<SubjectCategoryGroup>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [completedSkillTags] = useState<string[]>(() => {
    try {
      const key = `completed_student_topics_${profile?.id || 'default'}`;
      const direct = JSON.parse(localStorage.getItem(key) || '[]');
      const generic = JSON.parse(localStorage.getItem('completed_student_topics') || '[]');
      return Array.from(new Set([...direct, ...generic]));
    } catch {
      return [];
    }
  });

  const filteredCatalog = useMemo(() => {
    return SUBJECT_CATALOG.filter((sub) => {
      const matchesGroup =
        selectedCategoryGroup === 'All' || sub.categoryGroup === selectedCategoryGroup;
      if (!matchesGroup) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        sub.name.toLowerCase().includes(q) ||
        sub.tagline.toLowerCase().includes(q) ||
        sub.description.toLowerCase().includes(q) ||
        sub.categoryGroup.toLowerCase().includes(q) ||
        sub.topics.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.skillTag.toLowerCase().includes(q)
        )
      );
    });
  }, [selectedCategoryGroup, searchQuery]);

  // =========================================================================
  // VIEW 2: DEDICATED SUBJECT OVERVIEW PAGE (Inspired by Image 2 & 3 Course View)
  // =========================================================================
  if (selectedSubjectDetail) {
    const subject = selectedSubjectDetail;
    const Icon = subject.icon;
    const completedCount = subject.topics.filter((t) =>
      completedSkillTags.includes(t.skillTag)
    ).length;
    const totalMinutes = subject.topics.reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const isAllDone = completedCount === subject.topics.length && subject.topics.length > 0;

    // Find first uncompleted topic to start, or fallback to first topic
    const firstUncompletedTopic =
      subject.topics.find((t) => !completedSkillTags.includes(t.skillTag)) || subject.topics[0];

    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 font-sans text-slate-800 select-none pb-16 animate-in fade-in duration-200">
        {/* Top Hero Banner (Rich dark emerald / forest theme like Image 2) */}
        <div
          className={`w-full rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg border border-slate-800/20 ${
            subject.heroBg || 'bg-[#153229]'
          }`}
        >
          {/* Subtle ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* Inner Content Grid */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-200/80">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectDetail(null)}
                  className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Subjects</span>
                </button>
                <span className="text-white/40">/</span>
                <span className="text-emerald-100">{subject.categoryGroup}</span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif sm:font-sans">
                  {subject.name}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100/90 font-medium mt-2 leading-relaxed">
                  {subject.tagline}
                </p>
              </div>

              {/* Metadata Badges Pills (Image 2 style) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-emerald-100">
                  <Layers className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{subject.topics.length} Lessons</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-emerald-100">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>~{totalMinutes} min total</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-emerald-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Multi-Modal Practice</span>
                </span>
                {subject.openStaxAttribution ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-xs font-bold text-emerald-200">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                    <span>OpenStax Grounded</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-emerald-100">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    <span>Completion Badge</span>
                  </span>
                )}
              </div>

              {/* Primary Launch Action Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => onSelectTopic(subject.id, firstUncompletedTopic.skillTag)}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-md transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>{isAllDone ? 'Review Subject Topics →' : 'Start Subject Practice →'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-900" />
                </button>
              </div>
            </div>

            {/* Right Side Emblem Illustration (Image 2 style) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 p-4 flex items-center justify-center shadow-inner relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-slate-800 flex items-center justify-center shadow-md">
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-[#153229]" />
                </div>
                {/* Floating mini badge */}
                <div className="absolute -bottom-2 -right-2 bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                  {completedCount}/{subject.topics.length} DONE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Primary Column (What you'll learn + Audience + Topics) */}
          <div className="lg:col-span-2 space-y-6">
            {/* "What you'll learn" Card (Exact match to Image 2 & 3 style) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  What you'll learn
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  By the end of this subject module, you'll be able to:
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {subject.whatYoullLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
                      <strong className="font-extrabold text-slate-900">{item.title}: </strong>
                      <span className="font-medium text-slate-600">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* "Who it's for" & "Before you start" Dual-Container (Image 3 style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Who it's for */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <Target className="w-4 h-4 text-[#32617d]" />
                  <span>Who it's for</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {subject.whoItsFor}
                </p>
              </div>

              {/* Before you start */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  <span>Before you start</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                  {subject.beforeYouStart.map((pre, pidx) => (
                    <li key={pidx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{pre}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* "Topics & Learning Path" Section with Priority Alignment (Image 1 & 2/3 style) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Subject Topics & Practice Path
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Follow the prioritized sequence below to build deep conceptual mastery:
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  {completedCount} of {subject.topics.length} Completed
                </div>
              </div>

              {/* Priority Ordered Topic Cards List */}
              <div className="space-y-3.5">
                {subject.topics.map((topic, index) => {
                  const isCompleted = completedSkillTags.includes(topic.skillTag);
                  return (
                    <div
                      key={topic.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
                            {topic.priorityLabel || `Priority ${index + 1}`}
                          </span>
                          <span className="text-xs font-bold text-[#32617d] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
                            {topic.skillTag}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3 text-emerald-700 stroke-[3]" /> Completed
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                          {topic.name}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {topic.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {topic.estimatedMinutes}m practice
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Difficulty Lvl {topic.difficultyLevel}
                          </span>
                        </div>
                      </div>

                      {/* Topic Action Button */}
                      <div className="flex-shrink-0 md:min-w-[170px]">
                        <button
                          type="button"
                          onClick={() => onSelectTopic(subject.id, topic.skillTag)}
                          className={`w-full py-3 px-5 rounded-xl font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                            isCompleted
                              ? 'bg-[#1b4332] hover:bg-[#143225] text-white'
                              : 'bg-[#32617d] hover:bg-[#284d63] text-white'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Practice Again ↺</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Start Topic →</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right / Sidebar Column */}
          <div className="space-y-6">
            {/* Subject Overview & Progress Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Module Overview
              </h3>

              {/* Progress Tracker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Topic Progress</span>
                  <span>{Math.round((completedCount / (subject.topics.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(completedCount / (subject.topics.length || 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {completedCount} of {subject.topics.length} topics finished
                </p>
              </div>

              {/* Fast start recommendation */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Recommended Action:</span>
                <button
                  type="button"
                  onClick={() => onSelectTopic(subject.id, firstUncompletedTopic.skillTag)}
                  className="w-full p-3 rounded-2xl bg-[#e8f0fe] hover:bg-blue-100/80 text-[#32617d] text-xs font-extrabold text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-[#32617d]/80 uppercase block font-bold">
                      Next Up:
                    </span>
                    <span className="truncate block font-extrabold">{firstUncompletedTopic.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </div>

              {/* Back to all subjects shortcut */}
              <button
                type="button"
                onClick={() => setSelectedSubjectDetail(null)}
                className="w-full py-2.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Browse All Subjects</span>
              </button>
            </div>

            {/* OpenStax Attribution Card if available */}
            {subject.openStaxAttribution && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <BookMarked className="w-4 h-4 text-[#32617d]" />
                  <span>Curriculum Reference</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1 text-xs">
                  <span className="font-bold text-slate-900 block">
                    {subject.openStaxAttribution.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">
                    {subject.openStaxAttribution.license}
                  </span>
                  <a
                    href={subject.openStaxAttribution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#32617d] font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                  >
                    View Source Textbook <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Neurodivergent Study Tip */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Neurodivergent Focus Tip</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Each topic is formatted into bite-sized 5-minute chunks with instant multi-modal feedback. Feel free to take short sensory breaks whenever needed!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: SUBJECT CATALOG GRID (Search & Categories — No Bottom Topics List)
  // =========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-800 select-none pb-12 animate-in fade-in duration-150">
      {/* Header Hero Section with Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#32617d] text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-[#32617d]" />
            <span>14-Subject Interactive Curriculum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Choose a Subject to Begin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Select a learning discipline from our full catalog below to view its curriculum overview, learning goals, and prioritized practice topics.
          </p>
        </div>

        {/* Integrated Search Bar */}
        <div className="relative flex items-center min-w-[260px] sm:min-w-[320px] self-start md:self-auto">
          <input
            type="text"
            placeholder="Search 14 subjects or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-4 pr-11 text-xs sm:text-sm font-medium bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#32617d] focus:bg-white transition-all shadow-xs"
          />
          <div className="absolute right-2 p-2 rounded-xl bg-[#32617d] text-white flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Category Group Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2 flex-shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Category:</span>
        </div>
        {CATEGORY_GROUPS.map((group) => {
          const isActive = selectedCategoryGroup === group;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedCategoryGroup(group)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#32617d] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {group}
            </button>
          );
        })}
      </div>

      {/* Subject Cards Grid (Clicking a card navigates to the dedicated Subject Overview Page) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Select Subject Area ({filteredCatalog.length} of {SUBJECT_CATALOG.length} Subjects)
          </h2>
          {searchQuery && (
            <span className="text-xs text-slate-500 font-semibold">
              Filtering by "{searchQuery}"
            </span>
          )}
        </div>

        {filteredCatalog.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <p className="text-sm font-bold text-slate-700">No subjects match your search.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryGroup('All');
              }}
              className="text-xs font-extrabold text-[#32617d] hover:underline cursor-pointer"
            >
              Clear filters to view all subjects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCatalog.map((subject) => {
              const Icon = subject.icon;
              const completedCount = subject.topics.filter((t) =>
                completedSkillTags.includes(t.skillTag)
              ).length;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubjectDetail(subject)}
                  className="group relative text-left p-5 rounded-3xl border bg-white hover:bg-slate-50/70 border-slate-200 hover:border-slate-300 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${subject.gradient} text-white flex items-center justify-center shadow-sm`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${subject.badgeBg} ${subject.badgeText}`}
                      >
                        {subject.categoryGroup}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#32617d] transition-colors leading-snug">
                        {subject.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5 line-clamp-1">
                        {subject.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-normal">
                      {subject.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#32617d]">
                    <div className="flex items-center gap-1.5">
                      <span>{subject.topics.length} Lessons</span>
                      {completedCount > 0 && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {completedCount}/{subject.topics.length} Done
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#32617d] group-hover:translate-x-1 transition-transform">
                      <span className="text-xs font-extrabold">Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
