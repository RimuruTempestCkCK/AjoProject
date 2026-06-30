using AjoTopup.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace AjoTopup.Controllers
{
    public class LoginController : BaseController
    {
        private DataAccessLayer DAL = new DataAccessLayer();
      
        // GET: Login
        public ActionResult Index()
        {
            if (Session["userid"] != null)
            {
                return Redirect("~/dashboard");
            }
            return View("~/Views/Login.cshtml");
        }

        [HttpPost]
        public ActionResult CekAuth()
        {
            var username = Request["txtusername"];
            var pass = Request["txtpassword"];
            BaseSqlServer.returnResult res = new BaseSqlServer.returnResult();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pass))
            {
                res.result = false;
                res.msg = "Username and Password are required";
                return Json(res);
            }

            username = username.ToLower().Trim();
            pass = pass?.Trim();

            // Hash the input password using SHA-256 to match the database hash
            string hashedInputPassword = ComputeSha256Hash(pass);

            // Fetch user from database
            var sql = string.Format(
                "SELECT * FROM Users WHERE LOWER(Username) = '{0}' AND PasswordHash = '{1}'", 
                username.Replace("'", "''"), 
                hashedInputPassword
            );
            
            Dictionary<string, object> userData;
            try
            {
                userData = DAL.getDataRow(sql);
            }
            catch (Exception ex)
            {
                res.result = false;
                res.msg = "Database Error: " + ex.Message;
                return Json(res);
            }

            if (userData != null && userData.Count > 0)
            {
                bool isActive = Convert.ToBoolean(userData["IsActive"]);
                if (!isActive)
                {
                    res.result = false;
                    res.msg = "Akun Anda dinonaktifkan. Silakan hubungi Administrator.";
                    return Json(res);
                }

                // Map roles to rules
                // sa -> Admin (role = "sa" or "Admin" in original app, let's map it cleanly)
                string roleName = userData["RoleName"].ToString();
                string rules = "Operator";
                int isadmin = 0;

                if (roleName == "Admin")
                {
                    rules = "sa";
                    isadmin = 1;
                }
                else if (roleName == "Manager")
                {
                    rules = "Manager";
                    isadmin = 0;
                }
                else
                {
                    rules = "Operator";
                    isadmin = 0;
                }

                // Set session
                Session["userid"] = userData["Id"];
                Session["username"] = userData["Username"];
                Session["name"] = userData["FullName"];
                Session["isadmin"] = isadmin;
                Session["rules"] = rules;

                // Update LastLoginDate
                string updateLoginDateSql = string.Format("UPDATE Users SET LastLoginDate = GETDATE() WHERE Id = {0}", userData["Id"]);
                DAL.execSQL(updateLoginDateSql);

                // Set cookies for logging / compatibility
                HttpCookie useridc = new HttpCookie("ajotopup_userid", userData["Id"].ToString());
                HttpCookie usernamec = new HttpCookie("ajotopup_username", userData["Username"].ToString());
                useridc.Expires = DateTime.Now.AddYears(1);
                usernamec.Expires = DateTime.Now.AddYears(1);
                Response.Cookies.Add(useridc);
                Response.Cookies.Add(usernamec);

                res.result = true;
                res.msg = "success";
                res.data = rules;
            }
            else
            {
                res.result = false;
                res.msg = "Username atau Password salah";
            }

            return Json(res); 
        }

        public ActionResult Logout()
        {
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetExpires(DateTime.Now.AddHours(-1));
            Response.Cache.SetNoStore();
            Session.Clear();
            Session.Abandon();

            // Clear cookies
            if (Request.Cookies["ajotopup_userid"] != null)
            {
                HttpCookie c = new HttpCookie("ajotopup_userid");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }
            if (Request.Cookies["ajotopup_username"] != null)
            {
                HttpCookie c = new HttpCookie("ajotopup_username");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }

            return RedirectToAction("Index");
        }

        private string ComputeSha256Hash(string rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("X2")); // UpperCase hex format (style 2 in SQL server CONVERT)
                }
                return builder.ToString();
            }
        }
    }
}
