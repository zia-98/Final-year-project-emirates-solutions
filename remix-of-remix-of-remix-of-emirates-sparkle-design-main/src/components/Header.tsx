import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail, ShoppingBag, User, Settings, Briefcase, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import NotificationBell from "@/components/NotificationBell";
import emiratesLogo from "@/assets/emirates-logo.jpg";
import { COMPANY } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const { totalItems, openCart } = useCart();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Internships", href: "/internships" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-gradient-primary text-primary-foreground py-2 px-4 text-sm">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">{COMPANY.phone}</span>
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Mail className="w-3 h-3" />
              <span className="hidden sm:inline">{COMPANY.email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "glass shadow-md" : "bg-background/80 backdrop-blur-sm"
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={emiratesLogo}
                alt={`${COMPANY.name} Logo`}
                className="h-12 w-12 rounded-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">{COMPANY.name}</h1>
                <p className="text-xs text-muted-foreground">{COMPANY.tagline}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative group ${isActive(link.href) ? "text-primary" : "text-foreground/80 hover:text-primary"
                    }`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all ${isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                    }`}></span>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Cart Button */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={openCart}
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild className="flex flex-col items-start gap-1 p-0 cursor-pointer">
                      <Link to="/profile" className="w-full px-2 py-1.5 flex flex-col hover:bg-muted/50 rounded-md transition-colors">
                        <div className="font-bold text-sm truncate w-full text-left">
                          {profile?.full_name || "Profile"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate w-full text-left">
                          {profile?.username ? `@${profile.username}` : user.email}
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    {!isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/applications" className="flex items-center gap-2 cursor-pointer">
                            <Briefcase className="w-4 h-4" />
                            My Applications
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/orders" className="flex items-center gap-2 cursor-pointer">
                            <ShoppingBag className="w-4 h-4" />
                            My Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/saved-roadmaps" className="flex items-center gap-2 cursor-pointer">
                            <Book className="w-4 h-4" />
                            Saved Roadmaps
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}

              {/* CTA Buttons - Desktop */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">Get Quote</Link>
                </Button>
                <Button size="sm" className="gradient-primary shadow-glow" asChild>
                  <Link to="/internships/apply">Apply Now</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden glass border-t">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                {!user && (
                  <Button variant="ghost" asChild>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Get Quote</Link>
                </Button>
                <Button className="gradient-primary" asChild>
                  <Link to="/internships/apply" onClick={() => setIsMobileMenuOpen(false)}>Apply Now</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
