import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChatDialog } from './AIChatDialog';

interface AIChatButtonProps {
    dashboardContext: {
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
    };
}

export function AIChatButton({ dashboardContext }: AIChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 z-50"
                size="icon"
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-primary-foreground" />
                ) : (
                    <MessageCircle className="h-6 w-6 text-primary-foreground" />
                )}
            </Button>

            {/* Chat Dialog */}
            <AIChatDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                dashboardContext={dashboardContext}
            />
        </>
    );
}
