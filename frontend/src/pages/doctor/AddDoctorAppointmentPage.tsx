// src/pages/doctor/AddDoctorAppointmentPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type Patient = { _id: string; firstName: string; lastName: string; phone?: string };

const AddDoctorAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  /* ───── state ───── */
  const [query,      setQuery]      = useState("");
  const [suggestions,setSuggestions]= useState<Patient[]>([]);
  const [patientId,  setPatientId]  = useState("");   // cel trimis la API
  const [date,       setDate]       = useState("");
  const [time,       setTime]       = useState("");
  const [reason,     setReason]     = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ───── autocomplete (debounce 400 ms) ───── */
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.get("/patient", { params: { search: query.trim() } }); // ↺ ruta corectă
        setSuggestions(res.data.patients || res.data || []);
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query]);

  /* ───── submit ───── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError("Selectați un pacient !"); return; }

    setError(null);
    setLoading(true);
    try {
      const appointmentDate = new Date(`${date}T${time}:00`);
      await api.post("/appointment", { patientId, appointmentDate, reason });
      alert("Programarea a fost creată!");
      navigate("/doctor/appointments", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Crearea programării a eșuat.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── UI ───── */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Adaugă programare</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---- Căutare pacient ---- */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium">Pacient</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPatientId("");          // dacă utilizatorul modifică manual, invalidăm
              }}
              placeholder="Nume / telefon"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* lista sugestii */}
            {query && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-56 overflow-y-auto">
                {suggestions.map((p) => (
                  <li
                    key={p._id}
                    onClick={() => {
                      setQuery(`${p.lastName} ${p.firstName}`);
                      setPatientId(p._id);
                      setSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                  >
                    <span>{p.lastName} {p.firstName}</span>
                    {p.phone && <span className="text-xs text-gray-500">{p.phone}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---- Data & ora ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Ora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ---- Motiv ---- */}
          <div>
            <label className="block mb-1 text-sm font-medium">Motiv</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            {loading ? "Se încarcă..." : "Salvează"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDoctorAppointmentPage;
