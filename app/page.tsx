import  RecipeGenerator  from "@/components/RecipeGenerator"
import { Boxes } from "@/components/ui/background-boxes";
import { cn } from "@/lib/utils";

export default function Page() {
  return (
    <div className="h-[100vh] min-h-fit relative w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center rounded-lg">
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
 
      <Boxes />
      <RecipeGenerator/>
    </div>
  )

}