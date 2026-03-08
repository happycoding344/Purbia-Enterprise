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

interface Vehicle {
    id: number
    registration_no: string
    model: string | null
}

interface VehicleSelectProps {
    value?: number
    onChange: (value: number) => void
    error?: string
}

export function VehicleSelect({
    value,
    onChange,
    error
}: VehicleSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [items, setItems] = React.useState<Vehicle[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [showAddDialog, setShowAddDialog] = React.useState(false)
    const [newReg, setNewReg] = React.useState("")
    const [newModel, setNewModel] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/vehicles')
            setItems(response.data)
        } catch (err) {
            console.error('Failed to fetch vehicles', err)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const handleAddNew = async () => {
        if (!newReg.trim()) return
        setIsSaving(true)
        try {
            const response = await api.post('/vehicles', { registration_no: newReg, model: newModel })
            const newItem = response.data
            setItems((prev) => [...prev, newItem].sort((a, b) => a.registration_no.localeCompare(b.registration_no)))
            onChange(newItem.id)
            setShowAddDialog(false)
            setNewReg("")
            setNewModel("")
            setOpen(false)
        } catch (err) {
            console.error('Failed to create vehicle', err)
        } finally {
            setIsSaving(false)
        }
    }

    const selectedItem = items.find((item) => item.id === value)

    return (
        <div className="space-y-2">
            <Label className={cn(error && "text-destructive")}>Vehicle Number</Label>
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
                        {selectedItem ? selectedItem.registration_no : "Select Vehicle..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder="Search Vehicle..." />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-4 text-sm text-center">
                                    <p className="mb-2">No vehicle found.</p>
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
                                        value={item.registration_no}
                                        onSelect={() => {
                                            onChange(item.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === item.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {item.registration_no} {item.model ? `(${item.model})` : ""}
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
                                    <Plus className="mr-2 h-4 w-4" /> Add New Vehicle
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
                        <DialogTitle>Add New Vehicle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="reg-no">Registration Number</Label>
                            <Input
                                id="reg-no"
                                value={newReg}
                                onChange={(e) => setNewReg(e.target.value.toUpperCase())}
                                placeholder="e.g. MH-01-AB-1234"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="model">Model (Optional)</Label>
                            <Input
                                id="model"
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                placeholder="e.g. Tata Prima"
                                className="mt-1"
                            />
                        </div>
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
