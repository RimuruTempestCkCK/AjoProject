using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace AjoTopup
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        { 
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {
        }

        public int insertSQL(string sql)
        {
            var returnid = 0;
            SqlConnection cnn = new SqlConnection(ConfigurationManager.ConnectionStrings["conStr"].ConnectionString);
            SqlCommand cmd = new SqlCommand();


            cnn.Open();
            //sqlTransaction trn = cnn.BeginTransaction();
            cmd.Connection = cnn;
            //cmd.Transaction = trn;

            try
            {
                cmd = new SqlCommand(sql, cnn); 
                returnid = Convert.ToInt32(cmd.ExecuteScalar());
                
            }
            catch
            { 
            }
            finally
            {
                cmd.Dispose();
                cnn.Close();
                cnn.Dispose();

            }
            return returnid;
        }


    }
}

