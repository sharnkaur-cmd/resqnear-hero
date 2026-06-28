import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { saveHero } from "@/lib/supabase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Hero — ResQNear" },
      { name: "description", content: "Join 24/7 trained heroes saving lives." },
    ],
  }),
  component: RegisterPage,
});

const SKILLS = [
  "Doctor",
  "Nurse",
  "CPR Trained",
  "Paramedic",
  "Ex-Military",
  "First Aider",
  "General Helper",
];


function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({length:70}).map((_,i)=>(
        <span
          key={i}
          className="absolute top-[-20px] rounded-sm"
          style={{
            left:`${Math.random()*100}%`,
            background:"#E94560",
            width:8,
            height:8,
            animation:"confetti-fall 3s linear forwards"
          }}
        />
      ))}
    </div>
  );
}



function RegisterPage(){

const [submitted,setSubmitted]=useState(false);
const [saving,setSaving]=useState(false);
const [error,setError]=useState<string|null>(null);
const [savedName,setSavedName]=useState("");


const [form,setForm]=useState({
 name:"",
 phone:"",
 skill:"Doctor",
 locality:"",
 pincode:"",
 available:true
});



const existingHero=localStorage.getItem("resqnear_hero");
const heroData=existingHero?JSON.parse(existingHero):null;



if(heroData){

return (

<main className="mx-auto max-w-xl px-5 pb-20 pt-8 text-center">


<div
className="mx-auto grid h-28 w-28 place-items-center rounded-full text-5xl font-black text-white"
style={{
background:"linear-gradient(135deg,#667eea,#764ba2)"
}}
>

{heroData.name.charAt(0).toUpperCase()}

</div>



<h2 className="text-2xl font-extrabold text-white mt-5">

Welcome back, {heroData.name.split(" ")[0]}!

</h2>


<p className="text-white/60 mt-2">

You are already a registered ResQNear Hero

</p>



<div className="inline-flex items-center gap-2 mt-5 rounded-full px-4 py-2 text-green-400 bg-green-500/20">

<CheckCircle2 size={18}/>

Verified Hero · {heroData.skill}

</div>



<p className="text-white/50 mt-5">

{heroData.locality}

</p>



<div className="flex flex-col gap-3 max-w-xs mx-auto mt-8">


<a
href="/"
className="rounded-2xl px-6 py-3 text-white font-bold text-center"
style={{
background:"linear-gradient(135deg,#667eea,#764ba2)"
}}
>

Back to Home

</a>



<button
onClick={()=>{
localStorage.removeItem("resqnear_hero");
window.location.reload();
}}
className="rounded-2xl border border-white/20 px-6 py-3 text-white/70"
>

Update My Registration

</button>


</div>



</main>

)

}



async function onSubmit(e:React.FormEvent){

e.preventDefault();

setSaving(true);
setError(null);


try{

const {error:dbError}=await saveHero(form);

if(dbError) throw dbError;



setSavedName(form.name);


localStorage.setItem(
"resqnear_hero",
JSON.stringify({
name:form.name,
phone:form.phone,
skill:form.skill,
locality:form.locality,
registered:true
})
);



setSubmitted(true);



setTimeout(()=>{

window.location.href="/";

},3000);



}catch(err){

setError(
err instanceof Error?err.message:"Could not save"
);

}finally{

setSaving(false);

}

}
return (
<main className="mx-auto max-w-xl px-5 pb-20 pt-8">


<header className="text-center">


<div
className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
style={{
background:"linear-gradient(135deg,#667eea,#764ba2)"
}}
>

<Heart className="text-white"/>

</div>



<h1 className="mt-4 text-3xl font-extrabold text-white">

Join <span className="text-gradient-primary">24/7 Heroes</span>

</h1>



<p className="mt-2 text-white/60">

Three minutes today. A lifetime for someone tomorrow.

</p>


</header>




<form
onSubmit={onSubmit}
className="mt-8 space-y-4 rounded-3xl glass-card p-6"
>



<Field label="Full Name">

<input
required
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
placeholder="Priya Sharma"
className={inputCls}
/>

</Field>




<Field label="Phone Number">

<input
required
type="tel"
value={form.phone}
onChange={(e)=>setForm({...form,phone:e.target.value})}
placeholder="+91 98xxxxxxx"
className={inputCls}
/>

</Field>




<Field label="Skill">

<select
value={form.skill}
onChange={(e)=>setForm({...form,skill:e.target.value})}
className={inputCls}
>

{SKILLS.map(skill=>(

<option key={skill}>
{skill}
</option>

))}

</select>

</Field>




<div className="grid grid-cols-2 gap-4">


<Field label="Locality">

<input
required
value={form.locality}
onChange={(e)=>setForm({...form,locality:e.target.value})}
placeholder="Your area"
className={inputCls}
/>

</Field>




<Field label="Pincode">

<input
required
maxLength={6}
value={form.pincode}
onChange={(e)=>setForm({...form,pincode:e.target.value})}
placeholder="560001"
className={inputCls}
/>

</Field>


</div>





<label className="flex justify-between items-center rounded-2xl border border-white/10 p-4">


<div>

<p className="font-semibold text-white">

Available right now

</p>

<p className="text-xs text-white/50">

Receive SOS alerts

</p>

</div>



<button
type="button"
onClick={()=>setForm({...form,available:!form.available})}
className={`h-7 w-12 rounded-full ${
form.available?"bg-green-500":"bg-white/20"
}`}
>

</button>


</label>





<button
disabled={saving}
className="w-full rounded-2xl py-4 text-white font-bold"
style={{
background:"linear-gradient(135deg,#667eea,#764ba2)"
}}
>

{
saving?
<Loader2 className="animate-spin mx-auto"/>
:
"Become a Hero"
}


</button>





{error && (

<div className="flex gap-2 bg-red-500/20 p-3 rounded-xl text-white">

<AlertCircle size={18}/>

{error}

</div>

)}


</form>





{submitted && (

<>

<Confetti/>


<div className="fixed inset-0 z-50 grid place-items-center bg-black/70">


<div className="rounded-3xl glass-card p-8 text-center">


<div
className="mx-auto grid h-28 w-28 place-items-center rounded-full text-5xl text-white font-black"
style={{
background:"linear-gradient(135deg,#667eea,#764ba2)"
}}
>

{savedName[0]?.toUpperCase() || "H"}

</div>



<div className="mt-4 text-green-400 font-bold">

✓ Registration Successful

</div>



<h2 className="text-2xl text-white font-bold mt-3">

Welcome {savedName.split(" ")[0]} 🎉

</h2>



<p className="text-white/60 mt-2">

You are now part of ResQNear 24/7 hero network

</p>



</div>


</div>

</>

)}



</main>
)

}



const inputCls =
"w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none";



function Field({
label,
children
}:{
label:string;
children:React.ReactNode
}){

return (

<label className="block">

<span className="text-xs text-white/60">
{label}
</span>

{children}

</label>

)

}