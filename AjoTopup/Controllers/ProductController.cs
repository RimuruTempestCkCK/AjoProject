using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using AjoTopup.Models;

namespace AjoTopup.Controllers
{
    public class ProductController : BaseController
    {
        private DataAccessLayer DAL = new DataAccessLayer();

        // GET: Product (Admin only)
        public ActionResult Index()
        {
            if (!userAccess)
            {
                return Redirect("~/login");
            }

            // Role check: Admin only
            string role = Session["rules"] != null ? Session["rules"].ToString() : "";
            if (role != "sa")
            {
                return Redirect("~/dashboard"); // Or show unauthorized
            }

            string sql = "SELECT * FROM Products ORDER BY Provider, ProductCode";
            var list = DAL.getDataList(sql);

            ViewBag.Products = list;
            ViewBag.Title = "Master Produk";
            return View("~/Views/Product/Index.cshtml");
        }

        // GET: Product/Create
        public ActionResult Create()
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Redirect("~/dashboard");
            }

            ViewBag.Title = "Tambah Produk Baru";
            return View("~/Views/Product/Create.cshtml");
        }

        // POST: Product/Create
        [HttpPost]
        public ActionResult Create(string productCode, string productName, string provider, decimal price, decimal? commission, bool isActive)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            if (string.IsNullOrEmpty(productCode) || string.IsNullOrEmpty(productName) || string.IsNullOrEmpty(provider) || price <= 0)
            {
                return Json(new { success = false, message = "Data input tidak lengkap atau tidak valid." });
            }

            productCode = productCode.Trim().ToUpper();
            productName = productName.Trim();

            // Validate provider value
            string[] validProviders = { "Telkomsel", "Indosat", "XL", "Axis" };
            if (!validProviders.Contains(provider))
            {
                return Json(new { success = false, message = "Provider tidak valid." });
            }

            try
            {
                // Check if product code already exists
                string checkSql = string.Format("SELECT COUNT(*) FROM Products WHERE ProductCode = '{0}'", productCode.Replace("'", "''"));
                int count = Convert.ToInt32(DAL.getData(checkSql));
                if (count > 0)
                {
                    return Json(new { success = false, message = "Kode produk '" + productCode + "' sudah terdaftar." });
                }

                // Insert product into database
                string insertSql = string.Format(
                    "INSERT INTO Products (ProductCode, ProductName, ProviderCode, Provider, Price, Commission, IsActive, CreatedBy, CreatedDate) " +
                    "VALUES ('{0}', '{1}', '{0}', '{2}', {3}, {4}, {5}, '{6}', GETDATE())",
                    productCode.Replace("'", "''"),
                    productName.Replace("'", "''"),
                    provider,
                    price.ToString("F2").Replace(",", "."),
                    commission.HasValue ? commission.Value.ToString("F2").Replace(",", ".") : "0",
                    isActive ? 1 : 0,
                    Session["username"].ToString().Replace("'", "''")
                );

                var res = DAL.execSQL(insertSql);
                if (res.result)
                {
                    return Json(new { success = true, message = "Produk berhasil ditambahkan." });
                }
                else
                {
                    return Json(new { success = false, message = "Gagal menyimpan ke database: " + res.msg });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // GET: Product/Edit/{id}
        public ActionResult Edit(int id)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Redirect("~/dashboard");
            }

            string sql = string.Format("SELECT * FROM Products WHERE Id = {0}", id);
            var product = DAL.getDataRow(sql);

            if (product == null || product.Count == 0)
            {
                return HttpNotFound("Produk tidak ditemukan.");
            }

            ViewBag.Product = product;
            ViewBag.Title = "Edit Produk";
            return View("~/Views/Product/Edit.cshtml");
        }

        // POST: Product/Edit
        [HttpPost]
        public ActionResult Edit(int id, string productName, decimal price, decimal? commission, bool isActive)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            if (string.IsNullOrEmpty(productName) || price <= 0)
            {
                return Json(new { success = false, message = "Data input tidak valid." });
            }

            productName = productName.Trim();

            try
            {
                string updateSql = string.Format(
                    "UPDATE Products SET ProductName = '{0}', Price = {1}, Commission = {2}, IsActive = {3}, UpdatedBy = '{4}', UpdatedDate = GETDATE() WHERE Id = {5}",
                    productName.Replace("'", "''"),
                    price.ToString("F2").Replace(",", "."),
                    commission.HasValue ? commission.Value.ToString("F2").Replace(",", ".") : "0",
                    isActive ? 1 : 0,
                    Session["username"].ToString().Replace("'", "''"),
                    id
                );

                var res = DAL.execSQL(updateSql);
                if (res.result)
                {
                    return Json(new { success = true, message = "Produk berhasil diperbarui." });
                }
                else
                {
                    return Json(new { success = false, message = "Gagal memperbarui database: " + res.msg });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Product/ToggleStatus
        [HttpPost]
        public ActionResult ToggleStatus(int id)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            try
            {
                string selectSql = string.Format("SELECT IsActive FROM Products WHERE Id = {0}", id);
                object activeObj = DAL.getData(selectSql);
                if (activeObj == null || activeObj.ToString() == "")
                {
                    return Json(new { success = false, message = "Produk tidak ditemukan." });
                }

                bool currentStatus = Convert.ToBoolean(activeObj);
                bool newStatus = !currentStatus;

                string updateSql = string.Format(
                    "UPDATE Products SET IsActive = {0}, UpdatedBy = '{1}', UpdatedDate = GETDATE() WHERE Id = {2}",
                    newStatus ? 1 : 0,
                    Session["username"].ToString().Replace("'", "''"),
                    id
                );

                var res = DAL.execSQL(updateSql);
                if (res.result)
                {
                    return Json(new { success = true, newStatus = newStatus, message = "Status produk berhasil diubah." });
                }
                else
                {
                    return Json(new { success = false, message = "Gagal mengubah status: " + res.msg });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}

