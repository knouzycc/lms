/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, CourseCategory, GradeLevel } from "./types";

export const INITIAL_COURSES: Course[] = [
  {
    id: "course-1",
    title: "التفاضل والتكامل - الوحدة الأولى (الاشتقاق وتطبيقاته)",
    description: "شرح وافٍ وتدريبات مكثفة على اشتقاق الدوال المثلثية، الاشتقاق الضمني والبارامتري، والمشتقات العليا للدالة، وتطبيقات المماس والعمودي ومعدلات التغير الزمنية.",
    grade: GradeLevel.THIRD,
    category: CourseCategory.PURE,
    price: 150,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 4,
    hoursCount: "6 ساعات",
    studentsCount: 1240,
    rating: 4.8,
    reviews: [
      {
        id: "rev-1-1",
        studentName: "أحمد عمر محمود",
        rating: 5,
        comment: "شرح تفصيلي ممتاز وخطوات واضحة جداً في حل مسائل الاشتقاق الضمني!",
        timestamp: "2026-07-10T14:30:00.000Z"
      },
      {
        id: "rev-1-2",
        studentName: "سارة محمد أحمد",
        rating: 4,
        comment: "المحاضرة الأولى رائعة جداً، والملخصات الـ PDF ساعدتني كثيراً في المذاكرة.",
        timestamp: "2026-07-12T18:20:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-1-1",
        courseId: "course-1",
        title: "المحاضرة 1: اشتقاق مقلوب الدوال المثلثية (قا س، قتا س، ظتا س)",
        duration: "1 ساعة و 30 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "ملخص اشتقاق الدوال المثلثية والقوانين الهامة.pdf",
        quiz: {
          id: "quiz-1-1",
          title: "اختبار المحاضرة الأولى: اشتقاق مقلوب الدوال المثلثية",
          questions: [
            {
              id: "q-1-1-1",
              text: "إذا كانت ص = قا (٣س)، فإن دص/دس تساوي:",
              options: [
                "٣ قا(٣س) ظا(٣س)",
                "قا(٣س) ظا(٣س)",
                "-٣ قا(٣س) ظا(٣س)",
                "٣ قتا(٣س) ظتا(٣س)"
              ],
              correctAnswerIndex: 0,
              explanation: "مشتقة قا(أ س) هي أ قا(أ س) ظا(أ س). وبما أن الزاوية هي ٣س، فإن المشتقة هي ٣ قا(٣س) ظا(٣س)."
            },
            {
              id: "q-1-1-2",
              text: "مشتقة الدالة ص = ظتا²(س) بالنسبة إلى س هي:",
              options: [
                "-٢ ظتا(س) قتا²(س)",
                "٢ ظتا(س) قتا²(س)",
                "-٢ قتا²(س)",
                "٢ ظتا(س)"
              ],
              correctAnswerIndex: 0,
              explanation: "باستخدام قاعدة القوة (سلسلة الاشتقاق): ص = [ظتا(س)]²، إذن دص/دس = ٢ ظتا(س) × مشتقة ظتا(س) وهي -قتا²(س). بالتبسيط نحصل على -٢ ظتا(س) قتا²(س)."
            },
            {
              id: "q-1-1-3",
              text: "إذا كانت ص = قتا(س)، فإن المشتقة الثانية د²ص/دس² عند س = π/٢ تساوي:",
              options: [
                "١",
                "٠",
                "-١",
                "٢"
              ],
              correctAnswerIndex: 0,
              explanation: "المشتقة الأولى دص/دس = -قتا(س) ظتا(س). المشتقة الثانية باستخدام قاعدة اشتقاق حاصل ضرب دالتين: د²ص/دس² = -قتا(س) × (-قتا²س) + ظتا(س) × (قتا س ظتا س) = قتا³(س) + قتا(س) ظتا²(س). عند س = π/٢: قتا(π/٢) = ١، ظتا(π/٢) = ٠. بالتعويض: ١³ + ١ × ٠ = ١."
            },
            {
              id: "q-1-1-4",
              text: "مشتقة جتا(س) بالنسبة لـ س هي جا(س).",
              options: ["صواب", "خطأ"],
              correctAnswerIndex: 1,
              explanation: "مشتقة جتا(س) بالنسبة لـ س هي -جا(س) وليس جا(س).",
              type: "true_false"
            },
            {
              id: "q-1-1-5",
              text: "إذا كانت ص = س³، فما قيمة دص/دس عند س = ٢؟ (اكتب إجابتك بالأرقام باللغة الإنجليزية)",
              options: [],
              correctAnswerIndex: -1,
              explanation: "ص = س³ إذن دص/دس = ٣س². عند س = ٢: دص/دس = ٣ × ٢² = ٣ × ٤ = ١٢.",
              type: "text",
              correctTextAnswer: "12"
            },
            {
              id: "q-1-1-6",
              text: "اختر جميع الدوال الزوجية من بين الخيارات التالية:",
              options: [
                "ص = جتا(س)",
                "ص = جا(س)",
                "ص = س²",
                "ص = س"
              ],
              correctAnswerIndex: -1,
              explanation: "الدوال الزوجية هي ص = جتا(س) لأن جتا(-س) = جتا(س)، وص = س² لأن (-س)² = س².",
              type: "multi_select",
              correctAnswersIndices: [0, 2]
            }
          ]
        }
      },
      {
        id: "lect-1-2",
        courseId: "course-1",
        title: "المحاضرة 2: الاشتقاق الضمني والبارامتري وطرق الحل السريعة",
        duration: "1 ساعة و 45 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "كتاب التدريبات - الاشتقاق الضمني والبارامتري.pdf",
        quiz: {
          id: "quiz-1-2",
          title: "اختبار المحاضرة الثانية: الاشتقاق الضمني والبارامتري",
          questions: [
            {
              id: "q-1-2-1",
              text: "إذا كانت س² + ص² = ٢٥، فإن دص/دس تساوي:",
              options: [
                "-س/ص",
                "س/ص",
                "-ص/س",
                "ص/س"
              ],
              correctAnswerIndex: 0,
              explanation: "بالاشتقاق الضمني للطرفين بالنسبة لـ س: ٢س + ٢ص (دص/دس) = ٠. إذن ٢ص (دص/دس) = -٢س، ومنها دص/دس = -س/ص."
            },
            {
              id: "q-1-2-2",
              text: "إذا كانت س = ن² + ١ ، ص = ن³ - ن، فإن دص/دس عندما ن = ١ تساوي:",
              options: [
                "١",
                "٢",
                "١.٥",
                "٠"
              ],
              correctAnswerIndex: 0,
              explanation: "دس/دن = ٢ن. دص/دن = ٣ن² - ١. باستخدام قاعدة السلسلة: دص/دس = (دص/دن) / (دس/دن) = (٣ن² - ١) / (٢ن). عندما ن = ١: دص/دس = (٣(١)² - ١) / (٢(١)) = ٢ / ٢ = ١."
            }
          ]
        }
      },
      {
        id: "lect-1-3",
        courseId: "course-1",
        title: "المحاضرة 3: المماس والعمودي والزاوية بين منحنيين",
        duration: "1 ساعة و 20 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "تمارين محلولة - معادلة المماس والعمودي للمنحنى.pdf"
      },
      {
        id: "lect-1-4",
        courseId: "course-1",
        title: "المحاضرة 4: المعدلات الزمنية المرتبطة ومسائل التطبيقات الحياتية",
        duration: "1 ساعة و 50 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "أقوى ملخص للمعدلات الزمنية المرتبطة.pdf"
      }
    ]
  },
  {
    id: "course-2",
    title: "الجبر والهندسة الفراغية - مبدأ العد والتوافيق والتباديل",
    description: "شرح تفصيلي لقوانين التباديل والتوافيق، مبدأ العد الأساسي، مبرهنة ذات الحدين ومفكوكها، مع حل أكثر من ١٠٠ فكرة وزارية هامة.",
    grade: GradeLevel.THIRD,
    category: CourseCategory.PURE,
    price: 130,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 3,
    hoursCount: "4.5 ساعات",
    studentsCount: 980,
    rating: 4.9,
    reviews: [
      {
        id: "rev-2-1",
        studentName: "يوسف خالد علي",
        rating: 5,
        comment: "مبدأ العد كان يمثل لي عقدة ولكن بفضل الله ثم المستر أصبح من أسهل الدروس.",
        timestamp: "2026-07-09T09:15:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-2-1",
        courseId: "course-2",
        title: "المحاضرة 1: التباديل والتوافيق ومبدأ العد الأساسي",
        duration: "1 ساعة و 40 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "شيت الواجب - التباديل والتوافيق.pdf",
        quiz: {
          id: "quiz-2-1",
          title: "اختبار المحاضرة الأولى: مبدأ العد والتوافيق والتباديل",
          questions: [
            {
              id: "q-2-1-1",
              text: "إذا كان ن ق ٣ = ن ق ٥، فإن قيمة ن تساوي:",
              options: [
                "٨",
                "١٥",
                "٥",
                "٣"
              ],
              correctAnswerIndex: 0,
              explanation: "من قانون التبسيط للتوافيق: إذا كان ن ق ر = ن ق هـ، فإما ر = هـ أو ر + هـ = ن. بما أن ٣ ≠ ٥، فإن ن = ٣ + ٥ = ٨."
            },
            {
              id: "q-2-1-2",
              text: "عدد طرق اختيار لجنة من ٣ رجال وسيدتين من بين ٦ رجال و٤ سيدات هو:",
              options: [
                "٦ ق ٣ × ٤ ق ٢",
                "٦ ق ٣ + ٤ ق ٢",
                "٦ ل ٣ × ٤ ل ٢",
                "١٠ ق ٥"
              ],
              correctAnswerIndex: 0,
              explanation: "حرف العطف 'و' يعني الضرب. نختار ٣ رجال من بين ٦ رجال بطرق عددها ٦ ق ٣، ونختار سيدتين من بين ٤ سيدات بطرق عددها ٤ ق ٢. إذن عدد الطرق الكلية = ٦ ق ٣ × ٤ ق ٢."
            }
          ]
        }
      },
      {
        id: "lect-2-2",
        courseId: "course-2",
        title: "المحاضرة 2: نظرية ذات الحدين وإيجاد الحد المشتمل على س^ك",
        duration: "1 ساعة و 30 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "ملخص قوانين نظرية ذات الحدين والحد العام.pdf"
      }
    ]
  },
  {
    id: "course-3",
    title: "الاستاتيكا التطبيقية - اتزان جسم على مستوى مائل خشن",
    description: "كورس متكامل في استاتيكا الصف الثالث الثانوي، يشمل دراسة قوى الاحتكاك، معامل الاحتكاك السكوني، زاوية الاحتكاك، واتزان جسم على مستوى أفقي ومائل خشن تحت تأثير قوى مختلفة.",
    grade: GradeLevel.THIRD,
    category: CourseCategory.APPLIED,
    price: 140,
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 3,
    hoursCount: "5 ساعات",
    studentsCount: 850,
    rating: 4.7,
    reviews: [
      {
        id: "rev-3-1",
        studentName: "دعاء عبد الرحمن",
        rating: 5,
        comment: "شرح رائع جداً لقوانين الاحتكاك السكوني واتزان الجسم على المستوى الخشن.",
        timestamp: "2026-07-11T16:45:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-3-1",
        courseId: "course-3",
        title: "المحاضرة 1: الاحتكاك على مستوى أفقي خشن وقوانين الاحتكاك السكوني",
        duration: "1 ساعة و 45 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "شرح وتدريبات اتزان جسم على مستوى أفقي خشن.pdf",
        quiz: {
          id: "quiz-3-1",
          title: "اختبار المحاضرة الأولى: قوانين الاحتكاك وقوى الاتزان",
          questions: [
            {
              id: "q-3-1-1",
              text: "إذا وضع جسم وزنه و نيوتن على مستوى أفقي خشن معامل الاحتكاك السكوني بينه وبين الجسم م_س، وأثرت عليه قوة أفقية تجعله على وشك الحركة، فإن القوة تساوي:",
              options: [
                "م_س × و",
                "م_س / و",
                "و / م_س",
                "و × جتا(هـ)"
              ],
              correctAnswerIndex: 0,
              explanation: "في حالة الاتزان النهائي (على وشك الحركة): ق = ح_س = م_س × ر. وبما أن ر = و (رد الفعل العمودي يساوي الوزن على مستوى أفقي وقوة أفقية)، فإن ق = م_س × و."
            },
            {
              id: "q-3-1-2",
              text: "إذا كانت زاوية الاحتكاك بين الجسم والمستوى هي ل، فإن رد الفعل المحصل ر' يساوي:",
              options: [
                "ر قا(ل)",
                "ر جتا(ل)",
                "ر ظا(ل)",
                "ر قتا(ل)"
              ],
              correctAnswerIndex: 0,
              explanation: "رد الفعل المحصل ر' = جذر( ر² + ح_س² ) = جذر( ر² + (م_س ر)² ) = ر جذر( ١ + م_س² ). وبما أن معامل الاحتكاك م_س = ظا(ل)، فإن ر' = ر جذر( ١ + ظا²(ل) ) = ر جذر( قا²(ل) ) = ر قا(ل)."
            }
          ]
        }
      }
    ]
  },
  {
    id: "course-4",
    title: "رياضيات عامة - حساب المثلثات والحل العام للمعادلات",
    description: "كورس مخصص لطلاب الصف الأول والثاني الثانوي لشرح الدوال المثلثية لضعف الزاوية، قوانين المجموع والفرق، والحل العام لجميع صور المعادلات المثلثية.",
    grade: GradeLevel.SECOND,
    category: CourseCategory.PURE,
    price: 90,
    image: "https://images.unsplash.com/photo-1453733190148-c44698c26578?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 2,
    hoursCount: "3 ساعات",
    studentsCount: 1560,
    rating: 4.5,
    reviews: [
      {
        id: "rev-4-1",
        studentName: "محمود حسن سعيد",
        rating: 4,
        comment: "تبسيط متميز لدرس حساب المثلثات وقوانين ضعف الزاوية لطلاب الثاني الثانوي.",
        timestamp: "2026-07-14T11:00:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-4-1",
        courseId: "course-4",
        title: "المحاضرة 1: قوانين جيب وجيب تمام وضعف الزاوية",
        duration: "1 ساعة و 30 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "شرح حساب المثلثات وتطبيقاتها للثاني الثانوي.pdf"
      }
    ]
  },
  {
    id: "course-5",
    title: "الفيزياء للثانوية العامة - الباب الأول (التيار الكهربي وقانون أوم)",
    description: "كورس متميز في شرح التيار الكهربي وقانون أوم وقانوني كيرشوف مع حل مسائل متنوعة وتدريبات مستمرة لضمان الفهم والتحصيل الكامل.",
    grade: GradeLevel.THIRD,
    category: CourseCategory.PHYSICS,
    price: 160,
    image: "https://images.unsplash.com/photo-1636466483364-3519d7309413?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 1,
    hoursCount: "2.5 ساعة",
    studentsCount: 650,
    rating: 4.8,
    reviews: [
      {
        id: "rev-5-1",
        studentName: "مازن هشام",
        rating: 5,
        comment: "شرح قانون كيرشوف كان رائعاً جداً ومبسطاً لأبعد الحدود.",
        timestamp: "2026-07-15T09:30:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-5-1",
        courseId: "course-5",
        title: "المحاضرة 1: قانون أوم وتوصيل المقاومات (التوالي والتوازي)",
        duration: "2 ساعة و 30 دقيقة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "ملخص قوانين الكهربية وتوصيل المقاومات.pdf"
      }
    ]
  },
  {
    id: "course-6",
    title: "الكيمياء للثانوية العامة - الكيمياء العضوية (الهيدروكربونات)",
    description: "شرح شامل ومبسط لأساسيات الكيمياء العضوية وتسمية الألكانات والألكينات والألكاينات مع مخططات تفاعلية لتسهيل الحفظ والفهم المستنير.",
    grade: GradeLevel.THIRD,
    category: CourseCategory.CHEMISTRY,
    price: 150,
    image: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=600",
    lecturesCount: 1,
    hoursCount: "2 ساعة",
    studentsCount: 720,
    rating: 4.9,
    reviews: [
      {
        id: "rev-6-1",
        studentName: "دعاء كمال",
        rating: 5,
        comment: "المخططات سهلت على حفظ التفاعلات الكيميائية بطريقة مدهشة!",
        timestamp: "2026-07-16T10:15:00.000Z"
      }
    ],
    lectures: [
      {
        id: "lect-6-1",
        courseId: "course-6",
        title: "المحاضرة 1: مقدمة في الكيمياء العضوية وتسمية الألكانات والألكينات",
        duration: "2 ساعة",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "كتاب شرح الكيمياء العضوية الجزء الأول.pdf"
      }
    ]
  }
];
