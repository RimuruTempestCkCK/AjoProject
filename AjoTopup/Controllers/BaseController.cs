using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AjoTopup.Controllers
{
    public abstract partial class BaseController : Controller
    {
        public struct userAccessPrivilage
        {
            public bool list;
            public bool create;
            public bool update;
            public bool delete;
            public bool approve;
            public bool cancel;
            public bool process;
        }

        public bool userAccess;
        public userAccessPrivilage UAPrivilage;

        public BaseController()
        {
            var page = this.HttpContext;
            var currContext = System.Web.HttpContext.Current;
            if (System.Web.HttpContext.Current.Session["userid"] != null)
            {
                userAccess = true;
            }
            else
                userAccess = false;

            ViewBag.showMenu = userAccess;
        }

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            string controlName = this.ControllerContext.RouteData.Values["controller"].ToString();
            string actionName = this.ControllerContext.RouteData.Values["action"].ToString();
            if (userAccess)
            {
                
                if (controlName.ToLower() == "login" && actionName.ToLower() != "logout")
                {
                    filterContext.Result = Redirect("~/dashboard");
                }
            }
            else
            { 
                if (controlName.ToLower() == "login")
                {
                    base.OnActionExecuting(filterContext);
                }
                else
                {
                    filterContext.Result = Redirect("~/login");
                }
            }
        }
    }
}
