import type { Spell } from "./model";

type Listener = () => void;

export class History {
    private stack: string[] = [];
    private index = -1;
    private listeners = new Set<Listener>();
    private limit = 80;

    push(spell: Spell): void {
        const snap = JSON.stringify(spell);
        if (this.stack[this.index] === snap) return;
        this.stack = this.stack.slice(0, this.index + 1);
        this.stack.push(snap);
        if (this.stack.length > this.limit) this.stack.shift();
        this.index = this.stack.length - 1;
        this.emit();
    }

    private emit(): void {
        this.listeners.forEach(l => l());
    }

    onChange(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    get canUndo(): boolean { return this.index > 0; }
    get canRedo(): boolean { return this.index < this.stack.length - 1; }

    undo(): Spell | null {
        if (!this.canUndo) return null;
        this.index--;
        this.emit();
        return JSON.parse(this.stack[this.index]);
    }

    redo(): Spell | null {
        if (!this.canRedo) return null;
        this.index++;
        this.emit();
        return JSON.parse(this.stack[this.index]);
    }

    reset(spell: Spell): void {
        this.stack = [JSON.stringify(spell)];
        this.index = 0;
        this.emit();
    }
}
