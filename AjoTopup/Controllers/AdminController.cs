using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web.Mvc;
using AjoTopup.Models;

namespace AjoTopup.Controllers
{
    public class AdminController : BaseController
    {
        private DataAccessLayer DAL = new DataAccessLayer();

        // 1. User Management Page
        public ActionResult Index()
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Redirect("~/dashboard");
            }

            string sql = "SELECT Id, Username, FullName, Email, PhoneNumber, RoleName, IsActive, LastLoginDate FROM Users ORDER BY Username";
            var users = DAL.getDataList(sql);

            ViewBag.Users = users;
            ViewBag.Title = "Kelola Pengguna";
            return View("~/Views/Admin/Users.cshtml");
        }

        // POST: Admin/CreateUser
        [HttpPost]
        public ActionResult CreateUser(string username, string fullName, string email, string phoneNumber, string password, string roleName)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(roleName))
            {
                return Json(new { success = false, message = "Data input tidak lengkap." });
            }

            username = username.Trim().ToLower();
            fullName = fullName.Trim();
            roleName = roleName.Trim();

            if (roleName != "Admin" && roleName != "Operator" && roleName != "Manager")
            {
                return Json(new { success = false, message = "Role tidak valid." });
            }

            try
            {
                // Check if username already exists
                string checkSql = string.Format("SELECT COUNT(*) FROM Users WHERE LOWER(Username) = '{0}'", username.Replace("'", "''"));
                int count = Convert.ToInt32(DAL.getData(checkSql));
                if (count > 0)
                {
                    return Json(new { success = false, message = "Username '" + username + "' sudah digunakan." });
                }

                // Hash password
                string passwordHash = ComputeSha256Hash(password);

                string insertSql = string.Format(
                    "INSERT INTO Users (Username, PasswordHash, FullName, Email, PhoneNumber, RoleName, IsActive, CreatedBy, CreatedDate) " +
                    "VALUES ('{0}', '{1}', '{2}', {3}, {4}, '{5}', 1, '{6}', GETDATE())",
                    username.Replace("'", "''"),
                    passwordHash,
                    fullName.Replace("'", "''"),
                    !string.IsNullOrEmpty(email) ? "'" + email.Replace("'", "''") + "'" : "NULL",
                    !string.IsNullOrEmpty(phoneNumber) ? "'" + phoneNumber.Replace("'", "''") + "'" : "NULL",
                    roleName,
                    Session["username"].ToString().Replace("'", "''")
                );

                var res = DAL.execSQL(insertSql);
                if (res.result)
                {
                    return Json(new { success = true, message = "Pengguna baru berhasil didaftarkan." });
                }
                else
                {
                    return Json(new { success = false, message = "Gagal menyimpan: " + res.msg });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Admin/EditUser
        [HttpPost]
        public ActionResult EditUser(int id, string fullName, string email, string phoneNumber, string roleName, bool isActive)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            if (string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(roleName))
            {
                return Json(new { success = false, message = "Nama Lengkap dan Role wajib diisi." });
            }

            fullName = fullName.Trim();
            roleName = roleName.Trim();

            if (roleName != "Admin" && roleName != "Operator" && roleName != "Manager")
            {
                return Json(new { success = false, message = "Role tidak valid." });
            }

            try
            {
                string updateSql = string.Format(
                    "UPDATE Users SET FullName = '{0}', Email = {1}, PhoneNumber = {2}, RoleName = '{3}', IsActive = {4}, UpdatedBy = '{5}', UpdatedDate = GETDATE() WHERE Id = {6}",
                    fullName.Replace("'", "''"),
                    !string.IsNullOrEmpty(email) ? "'" + email.Replace("'", "''") + "'" : "NULL",
                    !string.IsNullOrEmpty(phoneNumber) ? "'" + phoneNumber.Replace("'", "''") + "'" : "NULL",
                    roleName,
                    isActive ? 1 : 0,
                    Session["username"].ToString().Replace("'", "''"),
                    id
                );

                var res = DAL.execSQL(updateSql);
                if (res.result)
                {
                    return Json(new { success = true, message = "Data pengguna berhasil diperbarui." });
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

        // POST: Admin/ToggleUserStatus
        [HttpPost]
        public ActionResult ToggleUserStatus(int id)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" });
            }

            try
            {
                // Prevent admin from deactivating themselves
                int currentUserId = Convert.ToInt32(Session["userid"]);
                if (currentUserId == id)
                {
                    return Json(new { success = false, message = "Anda tidak dapat menonaktifkan akun sendiri." });
                }

                string selectSql = string.Format("SELECT IsActive FROM Users WHERE Id = {0}", id);
                object activeObj = DAL.getData(selectSql);
                if (activeObj == null || activeObj.ToString() == "")
                {
                    return Json(new { success = false, message = "Pengguna tidak ditemukan." });
                }

                bool currentStatus = Convert.ToBoolean(activeObj);
                bool newStatus = !currentStatus;

                string updateSql = string.Format(
                    "UPDATE Users SET IsActive = {0}, UpdatedBy = '{1}', UpdatedDate = GETDATE() WHERE Id = {2}",
                    newStatus ? 1 : 0,
                    Session["username"].ToString().Replace("'", "''"),
                    id
                );

                var res = DAL.execSQL(updateSql);
                if (res.result)
                {
                    return Json(new { success = true, newStatus = newStatus, message = "Status pengguna berhasil diubah." });
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

        // 2. Integration Logs Page (Admin only)
        public ActionResult Logs()
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Redirect("~/dashboard");
            }

            string sql = "SELECT TOP 100 Id, TrxId, LogType, RequestUrl, ResponseStatusCode, ExecutionTime, CreatedDate FROM TransactionLogs ORDER BY CreatedDate DESC";
            var logs = DAL.getDataList(sql);

            ViewBag.Logs = logs;
            ViewBag.Title = "Log Request/Response";
            return View("~/Views/Admin/Logs.cshtml");
        }

        // GET: Admin/LogDetail/{id}
        public ActionResult LogDetail(int id)
        {
            if (!userAccess || (Session["rules"] != null ? Session["rules"].ToString() : "") != "sa")
            {
                return Json(new { success = false, message = "Unauthorized access" }, JsonRequestBehavior.AllowGet);
            }

            string sql = string.Format("SELECT * FROM TransactionLogs WHERE Id = {0}", id);
            var log = DAL.getDataRow(sql);

            if (log == null || log.Count == 0)
            {
                return Json(new { success = false, message = "Log tidak ditemukan." }, JsonRequestBehavior.AllowGet);
            }

            var data = new {
                id = log["Id"],
                trxId = log["TrxId"],
                logType = log["LogType"],
                requestUrl = log["RequestUrl"] != DBNull.Value ? log["RequestUrl"] : null,
                requestBody = log["RequestBody"] != DBNull.Value ? log["RequestBody"] : null,
                responseStatusCode = log["ResponseStatusCode"] != DBNull.Value ? log["ResponseStatusCode"] : null,
                responseBody = log["ResponseBody"] != DBNull.Value ? log["ResponseBody"] : null,
                executionTime = log["ExecutionTime"] != DBNull.Value ? log["ExecutionTime"] : null,
                createdDate = Convert.ToDateTime(log["CreatedDate"]).ToString("dd-MMM-yyyy HH:mm:ss.fff")
            };

            return Json(new { success = true, data = data }, JsonRequestBehavior.AllowGet);
        }

        private string ComputeSha256Hash(string rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("X2"));
                }
                return builder.ToString();
            }
        }
    }
}

