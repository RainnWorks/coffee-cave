import { Zero } from "@rocicorp/zero";
import { schema, type Schema } from "../schema";
import { useQuery, useZero } from "@rocicorp/zero/react";

// Initialize Zero with the schema
const z = new Zero({
  server: "http://localhost:4848",
  userID: "dashboard-user",
  schema,
});

export default function App() {
  const z = useZero<Schema>();

  const [categories, { type }] = useQuery(
    z.query.category
      .orderBy("name", "asc")
      .related("menuItems", (q) => q.related("menuItem"))
  );
  

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (type !== "complete") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu data...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 mb-8 text-center">
        Coffee Cave Menu Dashboard
      </h1>

      {categories.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No categories or menu items found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Make sure your database contains menu data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-blue-50 p-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {category.icon && (
                    <span className="mr-2">{category.icon}</span>
                  )}
                  {category.name}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {category.menuItems.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm">
                    No items in this category
                  </p>
                ) : (
                  category.menuItems.map((item) => (
                    <div
                      key={item.menuItem?.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <span className="text-gray-800">{item.menuItem?.name}</span>
                      <span className="font-medium text-blue-600">
                        {formatPrice(item.menuItem?.price ?? 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
