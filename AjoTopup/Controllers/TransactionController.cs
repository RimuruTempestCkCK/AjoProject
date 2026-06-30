using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using Newtonsoft.Json;
using AjoTopup.Models;

namespace AjoTopup.Controllers
{
    public class TransactionController : BaseController
    {
        private DataAccessLayer DAL = new DataAccessLayer();

        // GET: Transaction (Form Topup)
        public ActionResult Index()
        {
            if (!userAccess)
            {
                return Redirect("~/login");
            }

            // Get active products
            string sql = "SELECT * FROM Products WHERE IsActive = 1 ORDER BY Provider, Price";
            var products = DAL.getDataList(sql);
            
            ViewBag.Products = products;
            ViewBag.Title = "Topup Pulsa";
            return View("~/Views/Transaction/Index.cshtml");
        }

        // POST: Transaction/Create
        [HttpPost]
        public async Task<ActionResult> Create(string productCode, string destination)
        {
            if (!userAccess)
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            try
            {
                // Dynamic Base URL to call local API controller
                string baseUrl = string.Format("{0}://{1}{2}", Request.Url.Scheme, Request.Url.Authority, Url.Content("~"));
                if (!baseUrl.EndsWith("/")) baseUrl += "/";
                string apiUrl = baseUrl + "api/transaction";

                // Prepare request body
                var reqData = new { productCode = productCode, destination = destination };
                string jsonPayload = JsonConvert.SerializeObject(reqData);

                // Use HttpWebRequest for wider framework compatibility
                HttpWebRequest webReq = (HttpWebRequest)WebRequest.Create(apiUrl);
                webReq.Method = "POST";
                webReq.ContentType = "application/json";
                webReq.Timeout = 40000; // 40 seconds

                // Copy session cookies to pass authorization to API
                webReq.CookieContainer = new CookieContainer();
                if (Request.Cookies["ajotopup_userid"] != null)
                {
                    webReq.CookieContainer.Add(new Cookie(
                        Request.Cookies["ajotopup_userid"].Name,
                        Request.Cookies["ajotopup_userid"].Value,
                        "/",
                        Request.Url.Host
                    ));
                }
                if (Request.Cookies["ajotopup_username"] != null)
                {
                    webReq.CookieContainer.Add(new Cookie(
                        Request.Cookies["ajotopup_username"].Name,
                        Request.Cookies["ajotopup_username"].Value,
                        "/",
                        Request.Url.Host
                    ));
                }

                // Copy ASP.NET Session cookie
                if (Request.Cookies["ASP.NET_SessionId"] != null)
                {
                    webReq.CookieContainer.Add(new Cookie(
                        "ASP.NET_SessionId",
                        Request.Cookies["ASP.NET_SessionId"].Value,
                        "/",
                        Request.Url.Host
                    ));
                }

                byte[] bytes = Encoding.UTF8.GetBytes(jsonPayload);
                webReq.ContentLength = bytes.Length;

                using (Stream stream = await webReq.GetRequestStreamAsync())
                {
                    await stream.WriteAsync(bytes, 0, bytes.Length);
                }

                using (WebResponse webRes = await webReq.GetResponseAsync())
                {
                    using (StreamReader reader = new StreamReader(webRes.GetResponseStream()))
                    {
                        string resJson = await reader.ReadToEndAsync();
                        var apiResponse = JsonConvert.DeserializeObject<ApiResponse>(resJson);
                        
                        if (apiResponse != null && apiResponse.StatusCode == 200)
                        {
                            return Json(new { success = true, data = apiResponse.Data });
                        }
                        else
                        {
                            string errMsg = apiResponse != null ? apiResponse.Message : "API returned an invalid response.";
                            return Json(new { success = false, message = errMsg });
                        }
                    }
                }
            }
            catch (WebException webEx)
            {
                string errMsg = webEx.Message;
                if (webEx.Response != null)
                {
                    using (var r = new StreamReader(webEx.Response.GetResponseStream()))
                    {
                        string errorContent = r.ReadToEnd();
                        try
                        {
                            var errResponse = JsonConvert.DeserializeObject<ApiResponse>(errorContent);
                            if (errResponse != null && !string.IsNullOrEmpty(errResponse.Message))
                            {
                                errMsg = errResponse.Message;
                            }
                        }
                        catch { }
                    }
                }
                return Json(new { success = false, message = "HTTP Error: " + errMsg });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "System Error: " + ex.Message });
            }
        }

        // GET: Transaction/History
        public ActionResult History()
        {
            if (!userAccess)
            {
                return Redirect("~/login");
            }

            // Load products for search filter
            string sqlProducts = "SELECT ProductCode, ProductName FROM Products ORDER BY ProductName";
            ViewBag.ProductList = DAL.getDataList(sqlProducts);

            ViewBag.Title = "Riwayat Transaksi";
            return View("~/Views/Transaction/History.cshtml");
        }

        // GET: Transaction/Detail/{id}
        public async Task<ActionResult> Detail(string id)
        {
            if (!userAccess)
            {
                return Redirect("~/login");
            }

            try
            {
                // Dynamic Base URL to call local API controller
                string baseUrl = string.Format("{0}://{1}{2}", Request.Url.Scheme, Request.Url.Authority, Url.Content("~"));
                if (!baseUrl.EndsWith("/")) baseUrl += "/";
                string apiUrl = baseUrl + "api/transaction/" + id;

                HttpWebRequest webReq = (HttpWebRequest)WebRequest.Create(apiUrl);
                webReq.Method = "GET";
                webReq.Timeout = 10000;

                // Copy session cookies
                webReq.CookieContainer = new CookieContainer();
                if (Request.Cookies["ASP.NET_SessionId"] != null)
                {
                    webReq.CookieContainer.Add(new Cookie("ASP.NET_SessionId", Request.Cookies["ASP.NET_SessionId"].Value, "/", Request.Url.Host));
                }

                using (WebResponse webRes = await webReq.GetResponseAsync())
                {
                    using (StreamReader reader = new StreamReader(webRes.GetResponseStream()))
                    {
                        string resJson = await reader.ReadToEndAsync();
                        var apiResponse = JsonConvert.DeserializeObject<ApiResponseDetail>(resJson);

                        if (apiResponse != null && apiResponse.StatusCode == 200)
                        {
                            ViewBag.Trx = apiResponse.Data;
                            ViewBag.Logs = apiResponse.Data.Logs;
                        }
                        else
                        {
                            ViewBag.ErrorMessage = apiResponse != null ? apiResponse.Message : "API returned empty response.";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Gagal mengambil detail transaksi: " + ex.Message;
            }

            ViewBag.Title = "Detail Transaksi";
            return View("~/Views/Transaction/Detail.cshtml");
        }

        // Response DTO wrapper
        private class ApiResponse
        {
            public int StatusCode { get; set; }
            public string Message { get; set; }
            public object Data { get; set; }
        }

        private class ApiResponseDetail
        {
            public int StatusCode { get; set; }
            public string Message { get; set; }
            public TransactionDetailData Data { get; set; }
        }

        public class TransactionDetailData
        {
            public string TrxId { get; set; }
            public string ProductCode { get; set; }
            public string ProductName { get; set; }
            public string Provider { get; set; }
            public string Destination { get; set; }
            public decimal Amount { get; set; }
            public decimal Commission { get; set; }
            public string Status { get; set; }
            public string ProviderStatus { get; set; }
            public string ProviderMessage { get; set; }
            public string SerialNumber { get; set; }
            public string RequestDate { get; set; }
            public string ResponseDate { get; set; }
            public int? ProcessingTime { get; set; }
            public string CreatedBy { get; set; }
            public List<TransactionDetailLog> Logs { get; set; }
        }

        public class TransactionDetailLog
        {
            public int LogId { get; set; }
            public string LogType { get; set; }
            public string RequestUrl { get; set; }
            public string RequestBody { get; set; }
            public int? ResponseStatusCode { get; set; }
            public string ResponseBody { get; set; }
            public int? ExecutionTime { get; set; }
            public string CreatedDate { get; set; }
        }
    }
}

