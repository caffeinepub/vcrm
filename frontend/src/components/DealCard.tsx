import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { DealStage } from '../backend';
import type { Deal } from '../backend';

interface DealCardProps {
  deal: Deal;
  customerName: string;
  onEdit: () => void;
  onDelete: () => void;
  onMoveStage: (stage: DealStage) => void;
}

const STAGE_LABELS: Record<DealStage, string> = {
  [DealStage.new_]: 'New',
  [DealStage.inProgress]: 'In Progress',
  [DealStage.won]: 'Won',
  [DealStage.lost]: 'Lost',
};

const OTHER_STAGES = (current: DealStage): DealStage[] =>
  [DealStage.new_, DealStage.inProgress, DealStage.won, DealStage.lost].filter(
    (s) => s !== current
  );

export default function DealCard({ deal, customerName, onEdit, onDelete, onMoveStage }: DealCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{deal.title}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{customerName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {OTHER_STAGES(deal.stage).map((s) => (
              <DropdownMenuItem key={s} onClick={() => onMoveStage(s)}>
                <ArrowRight className="w-3.5 h-3.5 mr-2" />
                Move to {STAGE_LABELS[s]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-sm font-semibold text-foreground">
          ₹{deal.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}
