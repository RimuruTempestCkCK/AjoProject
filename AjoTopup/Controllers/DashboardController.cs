using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using AjoTopup.Models;

namespace AjoTopup.Controllers
{
    public class DashboardController : BaseController
    {
        private DataAccessLayer DAL = new DataAccessLayer();

        // GET: Dashboard
        public ActionResult Index()
        {
            if (!userAccess)
            {
                return Redirect("~/login");
            }

            try
            {
                // 1. Total Transactions Today (Count & Amount)
                string totalSql = "SELECT COUNT(*) as TrxCount, ISNULL(SUM(Amount), 0) as TrxAmount FROM Transactions WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE)";
                var totalRow = DAL.getDataRow(totalSql);
                int totalCount = Convert.ToInt32(totalRow["TrxCount"]);
                decimal totalAmount = Convert.ToDecimal(totalRow["TrxAmount"]);

                // 2. Success Count & Percentage
                string successSql = "SELECT COUNT(*) FROM Transactions WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE) AND Status = 'SUCCESS'";
                int successCount = Convert.ToInt32(DAL.getData(successSql));
                double successPct = totalCount > 0 ? Math.Round((double)successCount / totalCount * 100, 1) : 0;

                // 3. Failed Count & Percentage
                string failedSql = "SELECT COUNT(*) FROM Transactions WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE) AND Status = 'FAILED'";
                int failedCount = Convert.ToInt32(DAL.getData(failedSql));
                double failedPct = totalCount > 0 ? Math.Round((double)failedCount / totalCount * 100, 1) : 0;

                // 4. Pending Count
                string pendingSql = "SELECT COUNT(*) FROM Transactions WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE) AND Status = 'PENDING'";
                int pendingCount = Convert.ToInt32(DAL.getData(pendingSql));

                // 5. Top 5 Products
                string topProductsSql = 
                    "SELECT TOP 5 t.ProductCode, p.ProductName, COUNT(*) as TrxCount " +
                    "FROM Transactions t " +
                    "INNER JOIN Products p ON t.ProductCode = p.ProductCode " +
                    "WHERE CAST(t.RequestDate AS DATE) = CAST(GETDATE() AS DATE) " +
                    "GROUP BY t.ProductCode, p.ProductName " +
                    "ORDER BY TrxCount DESC";
                var topProductsList = DAL.getDataList(topProductsSql);
                
                // Calculate percentage for each top product
                var topProducts = new List<Dictionary<string, object>>();
                foreach (var row in topProductsList)
                {
                    int count = Convert.ToInt32(row["TrxCount"]);
                    double pct = totalCount > 0 ? Math.Round((double)count / totalCount * 100, 1) : 0;
                    
                    var item = new Dictionary<string, object>();
                    item["ProductName"] = row["ProductName"];
                    item["Count"] = count;
                    item["Percentage"] = pct;
                    topProducts.Add(item);
                }

                // 6. Transactions per hour (for chart)
                string perHourSql = 
                    "SELECT DATEPART(HOUR, RequestDate) as TrxHour, COUNT(*) as TrxCount " +
                    "FROM Transactions " +
                    "WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE) " +
                    "GROUP BY DATEPART(HOUR, RequestDate) " +
                    "ORDER BY TrxHour";
                var perHourList = DAL.getDataList(perHourSql);
                
                // Initialize array for 24 hours
                int[] hourlyData = new int[24];
                foreach (var row in perHourList)
                {
                    int hour = Convert.ToInt32(row["TrxHour"]);
                    int count = Convert.ToInt32(row["TrxCount"]);
                    if (hour >= 0 && hour < 24)
                    {
                        hourlyData[hour] = count;
                    }
                }

                // Pass to ViewBag
                ViewBag.TotalCount = totalCount;
                ViewBag.TotalAmount = totalAmount;
                ViewBag.SuccessCount = successCount;
                ViewBag.SuccessPercentage = successPct;
                ViewBag.FailedCount = failedCount;
                ViewBag.FailedPercentage = failedPct;
                ViewBag.PendingCount = pendingCount;
                ViewBag.TopProducts = topProducts;
                ViewBag.HourlyDataJson = Newtonsoft.Json.JsonConvert.SerializeObject(hourlyData);

                ViewBag.Title = "Dashboard";
                return View("~/Views/Dashboard/Index.cshtml");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = ex.Message;
                return View("~/Views/Shared/Error.cshtml");
            }
        }
    }
}

