import Navbar from "@/app/components/navbar/Navbar";

export const metadata = { title: "Job radar" };

export default function RadarLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
