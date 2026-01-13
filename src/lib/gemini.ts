import { GoogleGenerativeAI } from '@google/generative-ai';

interface DashboardContext {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    storePerformance: Array<{
        name: string;
        sales: number;
        orders: number;
        target: number;
        progress: number;
    }>;
    salesData: Array<{
        date: string;
        store_name: string;
        orders: number;
        sales: number;
    }>;
}

// Initialize Gemini AI
const getGeminiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Please add your Gemini API key to the .env file');
    }

    return new GoogleGenerativeAI(apiKey);
};

/**
 * Chat with the AI about dashboard data in Arabic and Franco-Arabic
 * @param message User message in any language
 * @param context Dashboard data context
 * @returns AI response in Arabic and Franco-Arabic
 */
export async function chatWithDashboard(
    message: string,
    context: DashboardContext
): Promise<string> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // System prompt that teaches the AI about the dashboard and language requirements
        const systemPrompt = `أنت مساعد ذكي لنظام إدارة المبيعات لشركة cstore. 
You are an AI assistant for cstore's sales dashboard.

**CRITICAL INSTRUCTIONS:**
1. DETECT the language the user is asking in and respond ONLY in that SAME language
2. If user asks in Arabic (العربية) → respond in Arabic ONLY
3. If user asks in Franco-Arabic (Franko/Arabizi like "3aez" or "eh") → respond in Franco-Arabic ONLY
4. If user asks in English → respond in English ONLY
5. Use the dashboard data provided to answer questions accurately
6. Be conversational and helpful
7. For Franco-Arabic, use numbers for Arabic letters (3=ع, 2=أ, 7=ح, 5=خ, 8=ق, 9=ص, 6=ط)

**Store Information:**
- Dark Store (الفرع المظلم)
- Heliopolis (فرع مصر الجديدة)
- Tagmo (فرع التجمع)
- Maadi (فرع المعادي)

**Current Dashboard Data:**
- Total Sales: ${context.totalSales.toFixed(0)} EGP (إجمالي المبيعات)
- Total Orders: ${context.totalOrders} (إجمالي الطلبات)
- Avg Order Value: ${context.avgOrderValue.toFixed(0)} EGP (متوسط قيمة الطلب)

**Store Performance:**
${context.storePerformance.map(store => `
- ${store.name}: ${store.sales.toFixed(0)} EGP (${store.orders} orders, ${store.progress.toFixed(1)}% of target ${store.target.toFixed(0)} EGP)
`).join('\n')}

**REMEMBER:** 
- Respond in the SAME language as the user's question
- If they say "hi", "hey", "مرحبا", "هاي", etc., greet them and ask what they want to know
- Match their language style exactly`;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'فهمت! سأجيب بنفس اللغة التي تستخدمها. Fahemt! Ha respond bel logha elly enta test5demha. Understood! I will respond in the same language you use.' }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        return response.text();
    } catch (error) {
        // Fallback to demo mode with canned responses
        return getDemoResponse(message, context);
    }
}

/**
 * Demo mode responses when AI is not available
 */
function getDemoResponse(message: string, context: DashboardContext): string {
    const lowerMessage = message.toLowerCase();

    // Detect language
    const hasArabicScript = /[\u0600-\u06FF]/.test(message);
    const hasFrancoPattern = /[0-9]/.test(message) && /[a-z]/i.test(message);
    const isFranco = hasFrancoPattern || lowerMessage.includes('eh ') || lowerMessage.includes('3') ||
        lowerMessage.includes('7') || lowerMessage.includes('2') || lowerMessage.includes('meen') ||
        lowerMessage.includes('kam') || lowerMessage.includes('ay ') || lowerMessage.includes('el ');

    // Greetings
    if (lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('hello') ||
        lowerMessage.includes('مرحبا') || lowerMessage.includes('هاي') || lowerMessage.includes('ahlan') ||
        lowerMessage.includes('السلام') || lowerMessage.includes('salam')) {

        if (hasArabicScript) {
            return `مرحباً! أنا مساعدك الذكي للمبيعات. اسألني عن أي شيء تريد معرفته عن المبيعات، الطلبات، أو الأفرع.`;
        } else if (isFranco) {
            return `Ahlan! Ana mosa3dak el zaky lel sales. Es2alni 3an ay 7aga 3aez t3rafha 3an el sales, orders, aw el branches.`;
        } else {
            return `Hello! I'm your smart sales assistant. Ask me anything about sales, orders, or branches.`;
        }
    }

    // Highest sales branch (أعلى فرع / a3la / highest / most sales)
    if (lowerMessage.includes('أعلى') || lowerMessage.includes('اعلى') || lowerMessage.includes('a3la') ||
        lowerMessage.includes('highest') || (lowerMessage.includes('most') && lowerMessage.includes('sales'))) {
        const highestStore = context.storePerformance.reduce((prev, current) =>
            current.sales > prev.sales ? current : prev
        );

        if (hasArabicScript) {
            return `أعلى فرع في المبيعات: ${highestStore.name} بمبيعات ${highestStore.sales.toFixed(0)} جنيه`;
        } else if (isFranco) {
            return `A3la branch fel sales: ${highestStore.name} be ${(highestStore.sales / 1000).toFixed(0)}K geneih`;
        } else {
            return `Highest sales branch: ${highestStore.name} with ${highestStore.sales.toFixed(0)} EGP`;
        }
    }

    // Lowest sales branch (أقل فرع / a2al / lowest / least sales)
    if (lowerMessage.includes('أقل') || lowerMessage.includes('اقل') || lowerMessage.includes('a2al') ||
        lowerMessage.includes('lowest') || (lowerMessage.includes('least') && lowerMessage.includes('sales'))) {
        const lowestStore = context.storePerformance.reduce((prev, current) =>
            current.sales < prev.sales ? current : prev
        );

        if (hasArabicScript) {
            return `أقل فرع في المبيعات: ${lowestStore.name} بمبيعات ${lowestStore.sales.toFixed(0)} جنيه`;
        } else if (isFranco) {
            return `A2al branch fel sales: ${lowestStore.name} be ${(lowestStore.sales / 1000).toFixed(0)}K geneih`;
        } else {
            return `Lowest sales branch: ${lowestStore.name} with ${lowestStore.sales.toFixed(0)} EGP`;
        }
    }

    // Most orders branch (أكثر أوردرات / aktar orders / most orders)
    if ((lowerMessage.includes('أكثر') || lowerMessage.includes('اكثر') || lowerMessage.includes('aktar') ||
        lowerMessage.includes('most')) && (lowerMessage.includes('order') || lowerMessage.includes('طلب'))) {
        const mostOrdersStore = context.storePerformance.reduce((prev, current) =>
            current.orders > prev.orders ? current : prev
        );

        if (hasArabicScript) {
            return `أكثر فرع عامل أوردرات: ${mostOrdersStore.name} بـ ${mostOrdersStore.orders} طلب`;
        } else if (isFranco) {
            return `Aktar branch 3amel orders: ${mostOrdersStore.name} be ${mostOrdersStore.orders} order`;
        } else {
            return `Most orders branch: ${mostOrdersStore.name} with ${mostOrdersStore.orders} orders`;
        }
    }

    // Least orders branch (أقل أوردرات / a2al orders / least orders)
    if ((lowerMessage.includes('أقل') || lowerMessage.includes('اقل') || lowerMessage.includes('a2al') ||
        lowerMessage.includes('least')) && (lowerMessage.includes('order') || lowerMessage.includes('طلب'))) {
        const leastOrdersStore = context.storePerformance.reduce((prev, current) =>
            current.orders < prev.orders ? current : prev
        );

        if (hasArabicScript) {
            return `أقل فرع عامل أوردرات: ${leastOrdersStore.name} بـ ${leastOrdersStore.orders} طلب`;
        } else if (isFranco) {
            return `A2al branch 3amel orders: ${leastOrdersStore.name} be ${leastOrdersStore.orders} order`;
        } else {
            return `Least orders branch: ${leastOrdersStore.name} with ${leastOrdersStore.orders} orders`;
        }
    }

    // Target calculation questions (محتاج / me7tag / need / required / تحقيق الهدف / achieve target)
    if (lowerMessage.includes('محتاج') || lowerMessage.includes('me7tag') || lowerMessage.includes('need') ||
        lowerMessage.includes('تحقيق') || lowerMessage.includes('target') || lowerMessage.includes('هدف')) {

        // Calculate total remaining to target
        const totalRemaining = context.storePerformance.reduce((sum, s) => {
            const remaining = s.target - s.sales;
            return sum + (remaining > 0 ? remaining : 0);
        }, 0);

        const avgOrderValue = context.avgOrderValue > 0 ? context.avgOrderValue : 100;
        const ordersNeeded = Math.ceil(totalRemaining / avgOrderValue);

        if (hasArabicScript) {
            return `لتحقيق الهدف محتاج:\n- ${totalRemaining.toFixed(0)} جنيه\n- حوالي ${ordersNeeded} طلب إضافي\n(بناءً على متوسط قيمة الطلب ${avgOrderValue.toFixed(0)} جنيه)`;
        } else if (isFranco) {
            return `3ashan t7a2a2 el target me7tag:\n- ${(totalRemaining / 1000).toFixed(0)}K geneih\n- 7awaly ${ordersNeeded} order ziada\n(based 3ala avg order ${avgOrderValue.toFixed(0)} geneih)`;
        } else {
            return `To achieve target you need:\n- ${totalRemaining.toFixed(0)} EGP\n- About ${ordersNeeded} more orders\n(Based on avg order value of ${avgOrderValue.toFixed(0)} EGP)`;
        }
    }

    // Sales questions
    if (lowerMessage.includes('sales') || lowerMessage.includes('مبيعات') || lowerMessage.includes('el sales')) {
        if (hasArabicScript) {
            return `إجمالي المبيعات: ${context.totalSales.toFixed(0)} جنيه مصري`;
        } else if (isFranco) {
            return `Egmaly el sales: ${(context.totalSales / 1000).toFixed(0)}K geneih masry`;
        } else {
            return `Total Sales: ${context.totalSales.toFixed(0)} EGP`;
        }
    }

    // Orders questions
    if (lowerMessage.includes('order') || lowerMessage.includes('طلب') || lowerMessage.includes('kam el')) {
        if (hasArabicScript) {
            return `إجمالي الطلبات: ${context.totalOrders} طلب`;
        } else if (isFranco) {
            return `Egmaly el orders: ${context.totalOrders} order`;
        } else {
            return `Total Orders: ${context.totalOrders}`;
        }
    }

    // Best/top performing branch (أحسن / a7san / best / top)
    if (lowerMessage.includes('أحسن') || lowerMessage.includes('a7san') || lowerMessage.includes('best') ||
        lowerMessage.includes('top') || lowerMessage.includes('branch') || lowerMessage.includes('store') ||
        lowerMessage.includes('فرع')) {
        const bestStore = context.storePerformance.reduce((prev, current) =>
            current.progress > prev.progress ? current : prev
        );

        if (hasArabicScript) {
            return `أفضل فرع: ${bestStore.name} بمبيعات ${bestStore.sales.toFixed(0)} جنيه (${bestStore.progress.toFixed(1)}٪ من الهدف)`;
        } else if (isFranco) {
            return `A7san branch: ${bestStore.name} be sales ${(bestStore.sales / 1000).toFixed(0)}K geneih (${bestStore.progress.toFixed(1)}% men el target)`;
        } else {
            return `Best Branch: ${bestStore.name} with ${bestStore.sales.toFixed(0)} EGP sales (${bestStore.progress.toFixed(1)}% of target)`;
        }
    }

    // Date-specific queries (يوم معين / specific date / yom / date) - MUST BE BEFORE individual branch queries!
    // Check if asking about a specific date or date range
    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/) || message.match(/\d{1,2}\/\d{1,2}/);

    // Extract day number or range if asking "يوم 2" or "yom 1-10" or "من يوم 1 ليوم 10"
    let dayNumber = null;
    let dayRangeStart = null;
    let dayRangeEnd = null;

    const dayMatch = message.match(/يوم\s*(\d+)/) || message.match(/yom\s*(\d+)/);
    const rangeMatch = message.match(/(\d+)\s*-\s*(\d+)/) || message.match(/من\s*يوم\s*(\d+)\s*ل/) || message.match(/from\s*(\d+)\s*to\s*(\d+)/);

    if (rangeMatch) {
        dayRangeStart = parseInt(rangeMatch[1]);
        dayRangeEnd = parseInt(rangeMatch[2]) || parseInt(rangeMatch[1]) + 10; // default to +10 if not specified
    } else if (dayMatch) {
        dayNumber = parseInt(dayMatch[1]);
    }

    // Check if this is a date-related query
    const isDateQuery = dateMatch || dayNumber || dayRangeStart ||
        lowerMessage.includes('يوم') || lowerMessage.includes('yom') ||
        lowerMessage.includes('امبارح') || lowerMessage.includes('embareh') ||
        lowerMessage.includes('اليوم') || lowerMessage.includes('el yom') ||
        lowerMessage.includes('today') || lowerMessage.includes('yesterday') ||
        lowerMessage.includes('من يوم') || lowerMessage.includes('لحد يوم');

    if (isDateQuery && (dayRangeStart || dayNumber || dateMatch)) {

        // Check if asking about specific branch FIRST
        let specificBranch = null;
        if (lowerMessage.includes('dark') || lowerMessage.includes('المظلم') || lowerMessage.includes('الفندق')) specificBranch = 'Dark store';
        else if (lowerMessage.includes('helio') || lowerMessage.includes('مصر الجديدة')) specificBranch = 'Heliopolis';
        else if (lowerMessage.includes('tagmo') || lowerMessage.includes('تجمع')) specificBranch = 'Tagmo';
        else if (lowerMessage.includes('maadi') || lowerMessage.includes('معادي')) specificBranch = 'Maadi';

        if (dayRangeStart && dayRangeEnd) {
            // Handle date range query
            const relevantData = context.salesData.filter(d => {
                const day = parseInt(d.date.split('-')[2]);
                return day >= dayRangeStart && day <= dayRangeEnd;
            });

            if (relevantData.length > 0) {
                if (specificBranch) {
                    const branchData = relevantData.filter(d => d.store_name === specificBranch);
                    const totalSales = branchData.reduce((sum, d) => sum + d.sales, 0);
                    const totalOrders = branchData.reduce((sum, d) => sum + d.orders, 0);

                    if (hasArabicScript) {
                        return `${specificBranch} من يوم ${dayRangeStart} ليوم ${dayRangeEnd}:\n- المبيعات: ${totalSales.toFixed(0)} جنيه\n- الأوردرات: ${totalOrders} طلب`;
                    } else if (isFranco) {
                        return `${specificBranch} men yom ${dayRangeStart} le yom ${dayRangeEnd}:\n- El sales: ${(totalSales / 1000).toFixed(0)}K geneih\n- El orders: ${totalOrders} order`;
                    } else {
                        return `${specificBranch} from day ${dayRangeStart} to ${dayRangeEnd}:\n- Sales: ${totalSales.toFixed(0)} EGP\n- Orders: ${totalOrders}`;
                    }
                } else {
                    const totalSales = relevantData.reduce((sum, d) => sum + d.sales, 0);
                    const totalOrders = relevantData.reduce((sum, d) => sum + d.orders, 0);

                    if (hasArabicScript) {
                        return `إجمالي من يوم ${dayRangeStart} ليوم ${dayRangeEnd}:\n- المبيعات: ${totalSales.toFixed(0)} جنيه\n- الأوردرات: ${totalOrders} طلب`;
                    } else if (isFranco) {
                        return `Egmaly men yom ${dayRangeStart} le yom ${dayRangeEnd}:\n- El sales: ${(totalSales / 1000).toFixed(0)}K geneih\n- El orders: ${totalOrders} order`;
                    } else {
                        return `Total from day ${dayRangeStart} to ${dayRangeEnd}:\n- Sales: ${totalSales.toFixed(0)} EGP\n- Orders: ${totalOrders}`;
                    }
                }
            }
        } else {
            // Single day query
            let targetDate = '';

            if (dayNumber && context.salesData.length > 0) {
                // Find date with that day number
                const matchingDates = context.salesData
                    .map(d => d.date)
                    .filter((date, index, self) => self.indexOf(date) === index)
                    .filter(date => {
                        const day = parseInt(date.split('-')[2]);
                        return day === dayNumber;
                    });

                if (matchingDates.length > 0) {
                    targetDate = matchingDates[matchingDates.length - 1];
                }
            } else if (dateMatch && dateMatch[0]) {
                targetDate = dateMatch[0];
            } else if (context.salesData.length > 0) {
                const dates = context.salesData.map(d => d.date).sort();
                targetDate = dates[dates.length - 1];
            }

            if (targetDate) {
                const dateData = context.salesData.filter(d => d.date.includes(targetDate));

                if (dateData.length > 0) {
                    if (specificBranch) {
                        const branchDateData = dateData.find(d => d.store_name === specificBranch);
                        if (branchDateData) {
                            if (hasArabicScript) {
                                return `${specificBranch} يوم ${targetDate}:\n- المبيعات: ${branchDateData.sales.toFixed(0)} جنيه\n- الأوردرات: ${branchDateData.orders} طلب`;
                            } else if (isFranco) {
                                return `${specificBranch} yom ${targetDate}:\n- El sales: ${(branchDateData.sales / 1000).toFixed(0)}K geneih\n- El orders: ${branchDateData.orders} order`;
                            } else {
                                return `${specificBranch} on ${targetDate}:\n- Sales: ${branchDateData.sales.toFixed(0)} EGP\n- Orders: ${branchDateData.orders}`;
                            }
                        }
                    } else {
                        const totalSalesForDate = dateData.reduce((sum, d) => sum + d.sales, 0);
                        const totalOrdersForDate = dateData.reduce((sum, d) => sum + d.orders, 0);

                        if (hasArabicScript) {
                            return `إجمالي يوم ${targetDate}:\n- المبيعات: ${totalSalesForDate.toFixed(0)} جنيه\n- الأوردرات: ${totalOrdersForDate} طلب`;
                        } else if (isFranco) {
                            return `Egmaly yom ${targetDate}:\n- El sales: ${(totalSalesForDate / 1000).toFixed(0)}K geneih\n- El orders: ${totalOrdersForDate} order`;
                        } else {
                            return `Total for ${targetDate}:\n- Sales: ${totalSalesForDate.toFixed(0)} EGP\n- Orders: ${totalOrdersForDate}`;
                        }
                    }
                }
            }
        }
    }

    // Branch orders count (الفرع عامل كام أوردر / el branch 3amel kam order)
    // This is already in storePerformance, but let's handle it explicitly
    if ((lowerMessage.includes('عامل') || lowerMessage.includes('3amel')) &&
        (lowerMessage.includes('كام') || lowerMessage.includes('kam')) &&
        (lowerMessage.includes('order') || lowerMessage.includes('أوردر'))) {

        // Check which branch
        let branchName = null;
        if (lowerMessage.includes('dark')) branchName = 'Dark store';
        else if (lowerMessage.includes('helio')) branchName = 'Heliopolis';
        else if (lowerMessage.includes('tagmo')) branchName = 'Tagmo';
        else if (lowerMessage.includes('maadi')) branchName = 'Maadi';

        if (branchName) {
            const branchData = context.storePerformance.find(s => s.name === branchName);
            if (branchData) {
                if (hasArabicScript) {
                    return `${branchName} عامل ${branchData.orders} أوردر لحد دلوقتي`;
                } else if (isFranco) {
                    return `${branchName} 3amel ${branchData.orders} order le7ad delwa2ty`;
                } else {
                    return `${branchName} has made ${branchData.orders} orders so far`;
                }
            }
        }
    }
    // Dark Store specific
    if (lowerMessage.includes('dark')) {
        const darkStore = context.storePerformance.find(s => s.name === 'Dark store');
        if (darkStore) {
            if (hasArabicScript) {
                return `Dark Store:\n- المبيعات: ${darkStore.sales.toFixed(0)} جنيه\n- الأوردرات: ${darkStore.orders} طلب\n- الهدف: ${darkStore.target.toFixed(0)} جنيه\n- التقدم: ${darkStore.progress.toFixed(1)}٪`;
            } else if (isFranco) {
                return `Dark Store:\n- El sales: ${(darkStore.sales / 1000).toFixed(0)}K geneih\n- El orders: ${darkStore.orders} order\n- El target: ${(darkStore.target / 1000).toFixed(0)}K geneih\n- Progress: ${darkStore.progress.toFixed(1)}%`;
            } else {
                return `Dark Store:\n- Sales: ${darkStore.sales.toFixed(0)} EGP\n- Orders: ${darkStore.orders}\n- Target: ${darkStore.target.toFixed(0)} EGP\n- Progress: ${darkStore.progress.toFixed(1)}%`;
            }
        }
    }

    // Heliopolis specific
    if (lowerMessage.includes('helio') || lowerMessage.includes('مصر الجديدة')) {
        const helioStore = context.storePerformance.find(s => s.name === 'Heliopolis');
        if (helioStore) {
            if (hasArabicScript) {
                return `Heliopolis:\n- المبيعات: ${helioStore.sales.toFixed(0)} جنيه\n- الأوردرات: ${helioStore.orders} طلب\n- الهدف: ${helioStore.target.toFixed(0)} جنيه\n- التقدم: ${helioStore.progress.toFixed(1)}٪`;
            } else if (isFranco) {
                return `Heliopolis:\n- El sales: ${(helioStore.sales / 1000).toFixed(0)}K geneih\n- El orders: ${helioStore.orders} order\n- El target: ${(helioStore.target / 1000).toFixed(0)}K geneih\n- Progress: ${helioStore.progress.toFixed(1)}%`;
            } else {
                return `Heliopolis:\n- Sales: ${helioStore.sales.toFixed(0)} EGP\n- Orders: ${helioStore.orders}\n- Target: ${helioStore.target.toFixed(0)} EGP\n- Progress: ${helioStore.progress.toFixed(1)}%`;
            }
        }
    }

    // Tagmo specific
    if (lowerMessage.includes('tagmo') || lowerMessage.includes('تجمع')) {
        const tagmoStore = context.storePerformance.find(s => s.name === 'Tagmo');
        if (tagmoStore) {
            if (hasArabicScript) {
                return `Tagmo:\n- المبيعات: ${tagmoStore.sales.toFixed(0)} جنيه\n- الأوردرات: ${tagmoStore.orders} طلب\n- الهدف: ${tagmoStore.target.toFixed(0)} جنيه\n- التقدم: ${tagmoStore.progress.toFixed(1)}٪`;
            } else if (isFranco) {
                return `Tagmo:\n- El sales: ${(tagmoStore.sales / 1000).toFixed(0)}K geneih\n- El orders: ${tagmoStore.orders} order\n- El target: ${(tagmoStore.target / 1000).toFixed(0)}K geneih\n- Progress: ${tagmoStore.progress.toFixed(1)}%`;
            } else {
                return `Tagmo:\n- Sales: ${tagmoStore.sales.toFixed(0)} EGP\n- Orders: ${tagmoStore.orders}\n- Target: ${tagmoStore.target.toFixed(0)} EGP\n- Progress: ${tagmoStore.progress.toFixed(1)}%`;
            }
        }
    }

    // Maadi specific
    if (lowerMessage.includes('maadi') || lowerMessage.includes('معادي')) {
        const maadiStore = context.storePerformance.find(s => s.name === 'Maadi');
        if (maadiStore) {
            if (hasArabicScript) {
                return `Maadi:\n- المبيعات: ${maadiStore.sales.toFixed(0)} جنيه\n- الأوردرات: ${maadiStore.orders} طلب\n- الهدف: ${maadiStore.target.toFixed(0)} جنيه\n- التقدم: ${maadiStore.progress.toFixed(1)}٪`;
            } else if (isFranco) {
                return `Maadi:\n- El sales: ${(maadiStore.sales / 1000).toFixed(0)}K geneih\n- El orders: ${maadiStore.orders} order\n- El target: ${(maadiStore.target / 1000).toFixed(0)}K geneih\n- Progress: ${maadiStore.progress.toFixed(1)}%`;
            } else {
                return `Maadi:\n- Sales: ${maadiStore.sales.toFixed(0)} EGP\n- Orders: ${maadiStore.orders}\n- Target: ${maadiStore.target.toFixed(0)} EGP\n- Progress: ${maadiStore.progress.toFixed(1)}%`;
            }
        }
    }

    // Average order value
    if (lowerMessage.includes('average') || lowerMessage.includes('متوسط') || lowerMessage.includes('mtwst') || lowerMessage.includes('avg')) {
        if (hasArabicScript) {
            return `متوسط قيمة الطلب: ${context.avgOrderValue.toFixed(0)} جنيه`;
        } else if (isFranco) {
            return `Motwast el order: ${context.avgOrderValue.toFixed(0)} geneih`;
        } else {
            return `Average Order Value: ${context.avgOrderValue.toFixed(0)} EGP`;
        }
    }

    // Default response based on detected language
    if (hasArabicScript) {
        return `يمكنني مساعدتك في معرفة:\n- المبيعات والطلبات\n- أفضل وأقل الأفرع\n- ما تحتاجه لتحقيق الأهداف\nاسأل عن أي شيء!`;
    } else if (isFranco) {
        return `Momken asa3dak fe ma3refet:\n- El sales wel orders\n- A7san we a2al branches\n- Elly me7tag 3ashan t7a2a2 el target\nEs2al 3an ay 7aga!`;
    } else {
        return `I can help you with:\n- Sales and orders\n- Best and worst performing branches\n- What's needed to achieve targets\nAsk me anything!`;
    }
}
