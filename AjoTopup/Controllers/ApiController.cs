using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Mvc;
using Newtonsoft.Json;
using AjoTopup.Models;

namespace AjoTopup.Controllers
{
    public class ApiController : Controller
    {
        private DataAccessLayer DAL = new DataAccessLayer();

        // 1. Transaction endpoint: POST (create) or GET (history)
        [Route("api/transaction")]
        public async Task<ActionResult> Transaction()
        {
            if (Request.HttpMethod == "POST")
            {
                return await CreateTransaction();
            }
            else if (Request.HttpMethod == "GET")
            {
                return GetTransactionHistory();
            }

            return Json(new { statusCode = 405, message = "Method Not Allowed" }, JsonRequestBehavior.AllowGet);
        }

        // POST api/transaction
        private async Task<ActionResult> CreateTransaction()
        {
            string bodyStream;
            using (var reader = new StreamReader(Request.InputStream))
            {
                bodyStream = reader.ReadToEnd();
            }

            TransactionRequest request = null;
            try
            {
                request = JsonConvert.DeserializeObject<TransactionRequest>(bodyStream);
            }
            catch (Exception ex)
            {
                return Json(new { statusCode = 400, message = "Invalid JSON payload: " + ex.Message });
            }

            if (request == null || string.IsNullOrEmpty(request.ProductCode) || string.IsNullOrEmpty(request.Destination))
            {
                return Json(new { statusCode = 400, message = "Product Code and Destination are required" });
            }

            // Client/API Validation
            // 1. Check Product code
            string productSql = string.Format("SELECT * FROM Products WHERE ProductCode = '{0}'", request.ProductCode.Replace("'", "''"));
            var productData = DAL.getDataRow(productSql);
            if (productData == null || productData.Count == 0)
            {
                return Json(new
                {
                    statusCode = 400,
                    message = "Product not found",
                    errors = new[] { new { field = "productCode", message = string.Format("Product code '{0}' does not exist", request.ProductCode) } }
                });
            }

            if (Convert.ToBoolean(productData["IsActive"]) == false)
            {
                return Json(new
                {
                    statusCode = 400,
                    message = "Product is inactive",
                    errors = new[] { new { field = "productCode", message = "Product is currently inactive" } }
                });
            }

            // 2. Validate destination (8-12 digits, starts with 0)
            string destination = request.Destination.Trim();
            if (!Regex.IsMatch(destination, @"^0[0-9]{7,11}$"))
            {
                return Json(new
                {
                    statusCode = 400,
                    message = "Invalid destination number",
                    errors = new[] { new { field = "destination", message = "Destination number must be 8-12 digits and start with '0'" } }
                });
            }

            decimal amount = Convert.ToDecimal(productData["Price"]);
            decimal commission = productData["Commission"] != DBNull.Value ? Convert.ToDecimal(productData["Commission"]) : 0;

            // 3. Generate TrxId
            string todayStr = DateTime.Now.ToString("yyyyMMdd");
            string countSql = string.Format("SELECT COUNT(*) FROM Transactions WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE)");
            int todayTrxCount = Convert.ToInt32(DAL.getData(countSql));
            string trxId = string.Format("TRX{0}{1:D4}", todayStr, todayTrxCount + 1);

            // Get logged in user username
            string username = Session["username"] != null ? Session["username"].ToString() : "operator1";

            // Insert to database as PENDING
            var insertTrxData = new Dictionary<string, object>
            {
                { "TrxId", trxId },
                { "ProductCode", request.ProductCode },
                { "Destination", destination },
                { "Status", "PENDING" },
                { "Amount", amount },
                { "Commission", commission },
                { "CreatedBy", username }
            };

            // Using direct SQL because DAL's saveData expects create_user, update_user which are not in our Transactions table fields
            string insertSql = string.Format(
                "INSERT INTO Transactions (TrxId, ProductCode, Destination, Status, Amount, Commission, CreatedBy, RequestDate, CreatedDate) " +
                "VALUES ('{0}', '{1}', '{2}', 'PENDING', {3}, {4}, '{5}', GETDATE(), GETDATE())",
                trxId, request.ProductCode.Replace("'", "''"), destination.Replace("'", "''"), amount.ToString("F2").Replace(",", "."), commission.ToString("F2").Replace(",", "."), username.Replace("'", "''")
            );

            var dbRes = DAL.execSQL(insertSql);
            if (!dbRes.result)
            {
                return Json(new { statusCode = 500, message = "Database insert failed: " + dbRes.msg });
            }

            // Log: MVC_TO_API
            LogTransactionDetail(trxId, "MVC_TO_API", Request.Url.AbsoluteUri, bodyStream, 200, "");

            // Call Fake Provider
            // We call it locally/synchronously to simulate the provider HTTP request
            var providerRequest = new ProviderRequest
            {
                TrxId = trxId,
                ProductCode = request.ProductCode,
                Destination = destination
            };

            string providerReqBody = JsonConvert.SerializeObject(providerRequest);
            LogTransactionDetail(trxId, "API_TO_PROVIDER", "/api/provider/topup", providerReqBody, 0, "");

            var watch = System.Diagnostics.Stopwatch.StartNew();
            // Call simulated topup
            var providerResponse = SimulateTopupInternal(providerRequest);
            watch.Stop();

            string providerResBody = JsonConvert.SerializeObject(providerResponse);
            LogTransactionDetail(trxId, "API_RESPONSE", "/api/provider/topup", "", 200, providerResBody);

            // Update Transaction
            string updateSql = string.Format(
                "UPDATE Transactions SET Status = '{0}', ProviderStatus = '{0}', ProviderMessage = '{1}', SerialNumber = {2}, ResponseDate = GETDATE(), ResponseTime = {3} WHERE TrxId = '{4}'",
                providerResponse.Status,
                providerResponse.Message.Replace("'", "''"),
                providerResponse.Sn != null ? "'" + providerResponse.Sn.Replace("'", "''") + "'" : "NULL",
                watch.ElapsedMilliseconds,
                trxId
            );
            DAL.execSQL(updateSql);

            // Fetch final transaction details to return
            var finalTrx = DAL.getDataRow(string.Format("SELECT * FROM Transactions WHERE TrxId = '{0}'", trxId));

            var responseData = new
            {
                trxId = finalTrx["TrxId"],
                productCode = finalTrx["ProductCode"],
                productName = productData["ProductName"],
                destination = finalTrx["Destination"],
                amount = finalTrx["Amount"],
                status = finalTrx["Status"],
                providerMessage = finalTrx["ProviderMessage"],
                serialNumber = finalTrx["SerialNumber"] != DBNull.Value ? finalTrx["SerialNumber"] : null,
                requestDate = Convert.ToDateTime(finalTrx["RequestDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                responseDate = finalTrx["ResponseDate"] != DBNull.Value ? Convert.ToDateTime(finalTrx["ResponseDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ") : null
            };

            return Json(new
            {
                statusCode = 200,
                message = "Transaction processed successfully",
                data = responseData
            });
        }

        // GET api/transaction
        private ActionResult GetTransactionHistory()
        {
            string status = Request.QueryString["status"];
            string productCode = Request.QueryString["productCode"];
            string startDate = Request.QueryString["startDate"];
            string endDate = Request.QueryString["endDate"];
            string pageNumberStr = Request.QueryString["pageNumber"];
            string pageSizeStr = Request.QueryString["pageSize"];

            int pageNumber = string.IsNullOrEmpty(pageNumberStr) ? 1 : Convert.ToInt32(pageNumberStr);
            int pageSize = string.IsNullOrEmpty(pageSizeStr) ? 10 : Convert.ToInt32(pageSizeStr);

            string filter = " WHERE 1=1";
            if (!string.IsNullOrEmpty(status))
            {
                filter += string.Format(" AND t.Status = '{0}'", status.Replace("'", "''"));
            }
            if (!string.IsNullOrEmpty(productCode))
            {
                filter += string.Format(" AND t.ProductCode = '{0}'", productCode.Replace("'", "''"));
            }
            if (!string.IsNullOrEmpty(startDate))
            {
                filter += string.Format(" AND t.RequestDate >= '{0} 00:00:00'", startDate.Replace("'", "''"));
            }
            if (!string.IsNullOrEmpty(endDate))
            {
                filter += string.Format(" AND t.RequestDate <= '{0} 23:59:59'", endDate.Replace("'", "''"));
            }

            // Role access filter: Operator only sees their own transactions
            string role = Session["rules"] != null ? Session["rules"].ToString() : "Operator";
            string currentUsername = Session["username"] != null ? Session["username"].ToString() : "";
            if (role != "sa" && role != "Manager" && !string.IsNullOrEmpty(currentUsername))
            {
                filter += string.Format(" AND t.CreatedBy = '{0}'", currentUsername.Replace("'", "''"));
            }

            // Get total count
            string countSql = "SELECT COUNT(*) FROM Transactions t" + filter;
            int totalRecords = Convert.ToInt32(DAL.getData(countSql));

            int offset = (pageNumber - 1) * pageSize;

            string query = string.Format(
                "SELECT t.TrxId, t.ProductCode, p.ProductName, t.Destination, t.Status, t.Amount, t.RequestDate, t.ProviderMessage, t.SerialNumber " +
                "FROM Transactions t " +
                "INNER JOIN Products p ON t.ProductCode = p.ProductCode " +
                "{0} ORDER BY t.RequestDate DESC OFFSET {1} ROWS FETCH NEXT {2} ROWS ONLY",
                filter, offset, pageSize
            );

            var list = DAL.getDataList(query);
            var transactions = list.Select(row => new
            {
                trxId = row["TrxId"],
                productCode = row["ProductCode"],
                productName = row["ProductName"],
                destination = row["Destination"],
                status = row["Status"],
                amount = row["Amount"],
                requestDate = Convert.ToDateTime(row["RequestDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                providerMessage = row["ProviderMessage"] != DBNull.Value ? row["ProviderMessage"] : null,
                serialNumber = row["SerialNumber"] != DBNull.Value ? row["SerialNumber"] : null
            }).ToList();

            int totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

            return Json(new
            {
                statusCode = 200,
                message = "Success",
                data = new
                {
                    totalRecords = totalRecords,
                    pageNumber = pageNumber,
                    pageSize = pageSize,
                    totalPages = totalPages,
                    transactions = transactions
                }
            }, JsonRequestBehavior.AllowGet);
        }

        // GET api/transaction/{id}
        [Route("api/transaction/{id}")]
        public ActionResult GetTransactionDetail(string id)
        {
            string trxSql = string.Format(
                "SELECT t.*, p.ProductName, p.Provider " +
                "FROM Transactions t " +
                "INNER JOIN Products p ON t.ProductCode = p.ProductCode " +
                "WHERE t.TrxId = '{0}'", id.Replace("'", "''"));

            var trxRow = DAL.getDataRow(trxSql);
            if (trxRow == null || trxRow.Count == 0)
            {
                return Json(new { statusCode = 404, message = "Transaction not found" }, JsonRequestBehavior.AllowGet);
            }

            // Fetch logs for this transaction
            string logSql = string.Format("SELECT * FROM TransactionLogs WHERE TrxId = '{0}' ORDER BY CreatedDate ASC", id.Replace("'", "''"));
            var logRows = DAL.getDataList(logSql);

            var logsList = logRows.Select(row => new
            {
                logId = row["Id"],
                logType = row["LogType"],
                requestUrl = row["RequestUrl"] != DBNull.Value ? row["RequestUrl"] : null,
                requestBody = row["RequestBody"] != DBNull.Value ? row["RequestBody"] : null,
                responseStatusCode = row["ResponseStatusCode"] != DBNull.Value ? row["ResponseStatusCode"] : null,
                responseBody = row["ResponseBody"] != DBNull.Value ? row["ResponseBody"] : null,
                executionTime = row["ExecutionTime"] != DBNull.Value ? row["ExecutionTime"] : null,
                createdDate = Convert.ToDateTime(row["CreatedDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }).ToList();

            var responseData = new
            {
                trxId = trxRow["TrxId"],
                productCode = trxRow["ProductCode"],
                productName = trxRow["ProductName"],
                provider = trxRow["Provider"],
                destination = trxRow["Destination"],
                amount = trxRow["Amount"],
                commission = trxRow["Commission"] != DBNull.Value ? trxRow["Commission"] : 0,
                status = trxRow["Status"],
                providerStatus = trxRow["ProviderStatus"] != DBNull.Value ? trxRow["ProviderStatus"] : null,
                providerMessage = trxRow["ProviderMessage"] != DBNull.Value ? trxRow["ProviderMessage"] : null,
                serialNumber = trxRow["SerialNumber"] != DBNull.Value ? trxRow["SerialNumber"] : null,
                requestDate = Convert.ToDateTime(trxRow["RequestDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                responseDate = trxRow["ResponseDate"] != DBNull.Value ? Convert.ToDateTime(trxRow["ResponseDate"]).ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                processingTime = trxRow["ResponseTime"] != DBNull.Value ? trxRow["ResponseTime"] : null,
                createdBy = trxRow["CreatedBy"],
                logs = logsList
            };

            return Json(new
            {
                statusCode = 200,
                message = "Success",
                data = responseData
            }, JsonRequestBehavior.AllowGet);
        }

        // POST api/provider/topup
        [HttpPost]
        [Route("api/provider/topup")]
        public ActionResult ProviderTopup()
        {
            string bodyStream;
            using (var reader = new StreamReader(Request.InputStream))
            {
                bodyStream = reader.ReadToEnd();
            }

            ProviderRequest request = null;
            try
            {
                request = JsonConvert.DeserializeObject<ProviderRequest>(bodyStream);
            }
            catch
            {
                return Json(new { status = "FAILED", message = "Invalid input format", sn = (string)null });
            }

            var res = SimulateTopupInternal(request);
            return Json(res);
        }

        // Internal simulator logic
        private ProviderResponse SimulateTopupInternal(ProviderRequest request)
        {
            // Simulate network delay (100 - 1000ms)
            int delay = new Random().Next(100, 1000);
            Thread.Sleep(delay);

            var rand = new Random();
            int score = rand.Next(100);

            if (score < 85) // 85% success
            {
                string sn = "SN" + rand.Next(100000000, 999999999).ToString();
                return new ProviderResponse
                {
                    TrxId = request.TrxId,
                    Status = "SUCCESS",
                    Message = "Topup berhasil",
                    Sn = sn
                };
            }
            else
            {
                string[] errors = new string[] {
                    "Nomor tujuan tidak valid",
                    "Saldo provider tidak cukup",
                    "Timeout dari operator",
                    "Duplicate transaction"
                };
                string msg = errors[rand.Next(errors.Length)];
                return new ProviderResponse
                {
                    TrxId = request.TrxId,
                    Status = "FAILED",
                    Message = msg,
                    Sn = null
                };
            }
        }

        // Log helper
        private void LogTransactionDetail(string trxId, string logType, string url, string reqBody, int status, string resBody)
        {
            string sql;
            if (logType == "MVC_TO_API")
            {
                sql = string.Format(
                    "INSERT INTO TransactionLogs (TrxId, LogType, RequestUrl, RequestBody, CreatedDate) " +
                    "VALUES ('{0}', '{1}', '{2}', '{3}', GETDATE())",
                    trxId, logType, url.Replace("'", "''"), reqBody.Replace("'", "''")
                );
            }
            else if (logType == "API_TO_PROVIDER")
            {
                sql = string.Format(
                    "INSERT INTO TransactionLogs (TrxId, LogType, RequestUrl, RequestBody, CreatedDate) " +
                    "VALUES ('{0}', '{1}', '{2}', '{3}', GETDATE())",
                    trxId, logType, url.Replace("'", "''"), reqBody.Replace("'", "''")
                );
            }
            else // API_RESPONSE
            {
                sql = string.Format(
                    "INSERT INTO TransactionLogs (TrxId, LogType, ResponseStatusCode, ResponseBody, CreatedDate) " +
                    "VALUES ('{0}', '{1}', {2}, '{3}', GETDATE())",
                    trxId, logType, status, resBody.Replace("'", "''")
                );
            }

            DAL.execSQL(sql);
        }

        // DTO classes
        public class TransactionRequest
        {
            public string ProductCode { get; set; }
            public string Destination { get; set; }
        }

        public class ProviderRequest
        {
            public string TrxId { get; set; }
            public string ProductCode { get; set; }
            public string Destination { get; set; }
        }

        public class ProviderResponse
        {
            public string TrxId { get; set; }
            public string Status { get; set; }
            public string Message { get; set; }
            public string Sn { get; set; }
        }
    }
}

