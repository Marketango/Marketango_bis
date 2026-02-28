export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Personalización de marca de la agencia</p>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Marca (White Label)</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Agencia</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Principal</label>
            <input type="color" defaultValue="#3B82F6" className="h-10 w-full rounded-lg border border-gray-300 p-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Secundario</label>
            <input type="color" defaultValue="#1E40AF" className="h-10 w-full rounded-lg border border-gray-300 p-1" />
          </div>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
