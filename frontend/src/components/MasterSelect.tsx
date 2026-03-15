import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/axios"

interface MasterItem {
    id: number
    name: string
}

interface MasterSelectProps {
    type: string
    label: string
    placeholder?: string
    value?: number | string
    onChange: (value: any) => void
    error?: string
    valueKey?: 'id' | 'name'
}

export function MasterSelect({
    type,
    label,
    placeholder = "Select...",
    value,
    onChange,
    error,
    valueKey = 'id'
}: MasterSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [items, setItems] = React.useState<MasterItem[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [showAddDialog, setShowAddDialog] = React.useState(false)
    const [newName, setNewName] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const response = await api.get(`/masters/${type}`)
            setItems(response.data)
        } catch (err) {
            console.error(`Failed to fetch ${type}`, err)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [type])

    const handleAddNew = async () => {
        if (!newName.trim()) return
        setIsSaving(true)
        try {
            const response = await api.post(`/masters/${type}`, { name: newName })
            const newItem = response.data
            setItems((prev) => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)))
            
            onChange(valueKey === 'name' ? newItem.name : newItem.id)
            
            setShowAddDialog(false)
            setNewName("")
            setOpen(false)
        } catch (err) {
            console.error(`Failed to create ${type}`, err)
        } finally {
            setIsSaving(false)
        }
    }

    // Safely compare using string representation
    const selectedItem = items.find((item) => String(item[valueKey]) === String(value))
    
    // If we are looking by name and have a value but it's not in the list, we can fallback to displaying the value itself.
    const displayValue = selectedItem ? selectedItem.name : (valueKey === 'name' && value ? String(value) : placeholder)

    return (
        <div className="space-y-2">
            <Label className={cn(error && "text-destructive")}>{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between font-normal",
                            !value && "text-muted-foreground",
                            error && "border-destructive"
                        )}
                    >
                        {displayValue}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder={`Search ${label}...`} />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-4 text-sm text-center">
                                    <p className="mb-2">No {label.toLowerCase()} found.</p>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => setShowAddDialog(true)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add New
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.name}
                                        onSelect={() => {
                                            onChange(valueKey === 'name' ? item.name : item.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                String(value) === String(item[valueKey]) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <div className="p-2 border-t mt-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                        setShowAddDialog(true)
                                        setOpen(false)
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add New {label}
                                </Button>
                            </div>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-xs text-destructive">{error}</p>}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New {label}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-name">{label} Name</Label>
                        <Input
                            id="new-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={`Enter ${label.toLowerCase()} name`}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddNew} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
