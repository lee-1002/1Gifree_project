import { Suspense, lazy } from "react";

const Loading = <div>Loading....</div>;
const Purchase = lazy(() => import("../pages/order/PurchasePage"));
const Complete = lazy(() => import("../pages/order/CompletePage"));

const orderRouter = () => {
  return [
    {
      path: "purchase",
      element: (
        <Suspense fallback={Loading}>
          <Purchase />
        </Suspense>
      ),
    },
    {
      path: "Complete",
      element: (
        <Suspense fallback={Loading}>
          <Complete />
        </Suspense>
      ),
    },
  ];
};

export default orderRouter;
