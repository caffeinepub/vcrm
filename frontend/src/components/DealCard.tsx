import { type Deal, DealStage } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit2, Trash2, ArrowRight } from 'lucide-react';

interface StageOption {
  key: DealStage;
  label: string;
  color: string;
}

interface DealCardProps {
  deal: Deal;
  customerName: string;
  currentStage: DealStage;
  allStages: StageOption[];
  onMoveStage: (id: bigint, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (id: bigint) => void;
}

export default function DealCard({
  deal,
  customerName,
  currentStage,
  allStages,
  onMoveStage,
  onEdit,
  onDelete,
}: DealCardProps) {
  const otherStages = allStages.filter((s) => s.key !== currentStage);

  return (
    <Card className="shadow-xs hover:shadow-card transition-shadow cursor-default">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
            <p className="text-xs text-muted-foreground truncate">{customerName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreHorizontal size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(deal)}>
                <Edit2 size={13} className="mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {otherStages.map((s) => (
                <DropdownMenuItem key={s.key} onClick={() => onMoveStage(deal.id, s.key)}>
                  <ArrowRight size={13} className="mr-2" /> Move to {s.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(deal.id)}
              >
                <Trash2 size={13} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-sm font-bold text-foreground">
            ${deal.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
