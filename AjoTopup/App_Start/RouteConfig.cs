using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace AjoTopup
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                name: "ApiTransactionDetail",
                url: "api/transaction/{id}",
                defaults: new { controller = "Api", action = "GetTransactionDetail" },
                namespaces: new string[] { "AjoTopup.Controllers" }
            );

            routes.MapRoute(
                name: "ApiTransaction",
                url: "api/transaction",
                defaults: new { controller = "Api", action = "Transaction" },
                namespaces: new string[] { "AjoTopup.Controllers" }
            );

            routes.MapRoute(
                name: "ApiProviderTopup",
                url: "api/provider/topup",
                defaults: new { controller = "Api", action = "ProviderTopup" },
                namespaces: new string[] { "AjoTopup.Controllers" }
            );

            routes.MapRoute(
                name: "ApiTopupDirect",
                url: "api/topup",
                defaults: new { controller = "Api", action = "ProviderTopup" },
                namespaces: new string[] { "AjoTopup.Controllers" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Login", action = "Index", id = UrlParameter.Optional },
                namespaces: new string[] { "AjoTopup.Controllers" }
            );
        }
    }
}

