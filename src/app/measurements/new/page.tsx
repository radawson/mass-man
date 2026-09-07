import Navbar from '@/components/Navbar'
import MeasurementForm from '@/components/MeasurementForm'

export default function NewMeasurementPage() {
  return (
    <>
      <Navbar />
      <main className="app-page-container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Log measurement</h1>
        <MeasurementForm />
      </main>
    </>
  )
}
