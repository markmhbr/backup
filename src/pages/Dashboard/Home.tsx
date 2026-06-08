import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import SchoolMetrics from "../../components/school/SchoolMetrics";
import AttendanceChart from "../../components/school/AttendanceChart";
import CompletenessProgress from "../../components/school/CompletenessProgress";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | SIMAK Admin Panel"
        description="This is the main dashboard for SIMAK Admin Panel"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <SchoolMetrics />

          <CompletenessProgress />

          <AttendanceChart />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
