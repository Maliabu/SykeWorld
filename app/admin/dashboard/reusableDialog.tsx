

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit2, MailOpen, PlusCircle, Trash2, XCircle } from "lucide-react"

//reusable drawer
type ReusableDrawerProps = {
    page: string
    form: React.JSX.Element
  }
  
  export function ReusableDialog({
    page, 
    form,
  }: ReusableDrawerProps){
    return (
      <div className="w-full">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={page=='Edit'?"outline":"default"}>{page=='Edit'?<Edit2/>:page=='Reply'?<MailOpen/>:page==='Close'?<XCircle/>:page==="Delete"?<Trash2/>:<PlusCircle/>}{page}</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{page}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {form}
          </div>
        </DialogContent>
    </Dialog>
      </div>
    )
  }