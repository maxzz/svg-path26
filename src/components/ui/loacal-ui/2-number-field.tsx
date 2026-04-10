import { Input } from "@/components/ui/shadcn/input";

export function NumberField({
    label,
    value,
    onChange,
    min,
    step = "any",
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    step?: number | "any";
}) {
    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">{label}</span>
            <Input
                type="number"
                value={value}
                min={min}
                step={step}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
}
