import { notFound } from "next/navigation";

async function getHiker(id: string) {
  const res = await  fetch(`/api/hiker/${id}`,
     { cache: "no-store" });

  if (!res.ok) return null;

  return res.json();
}

export default async function HikerPage(
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    notFound();
  }

  const data = await getHiker(id);

  if (!data?.success) {
    notFound();
  }

  const hiker = data.hiker;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold">
          {hiker.name?.charAt(0) ?? "H"}
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {hiker.name ?? "Unnamed Hiker"}
        </h1>

        <p className="text-gray-500 mb-4">
          Hiking Level:{" "}
          <span className="font-semibold text-black">
            {hiker.hikingLevel}
          </span>
        </p>

        <p className="text-sm text-gray-400">
          Member since{" "}
          {new Date(hiker.createdAt).toDateString()}
        </p>
      </div>
    </div>
  );
}
