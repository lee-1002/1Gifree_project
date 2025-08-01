import { Suspense, lazy } from "react";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/donation/ListPage"));
const Read = lazy(() => import("../pages/donation/ReadPage"));
const Add = lazy(() => import("../pages/donation/AddPage"));
const Modify = lazy(() => import("../pages/donation/ModifyPage"));

const IndexComponent = lazy(() =>
  import("../components/donation/IndexComponent")
);

const donationRouter = () => {
  return [
    {
      path: "",
      element: (
        <Suspense fallback={Loading}>
          <IndexComponent />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={Loading}>
              <List />
            </Suspense>
          ),
        },
        {
          path: "read/:tno",
          element: (
            <Suspense fallback={Loading}>
              <Read />
            </Suspense>
          ),
        },
        {
          path: "add",
          element: (
            <Suspense fallback={Loading}>
              <Add />
            </Suspense>
          ),
        },
        {
          path: "modify/:tno",
          element: (
            <Suspense fallback={Loading}>
              <Modify />
            </Suspense>
          ),
        },
      ],
    },
  ];
};

export default donationRouter;
