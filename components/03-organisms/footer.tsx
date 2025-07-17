import Link from "next/link"

export function Footer() {
  const navigationItems = [
    { title: "Home", href: "/" },
    { title: "Projects", href: "/project" },
  ];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Logo</h3>
            <p className="text-muted-foreground">Building amazing digital experiences for businesses worldwide.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {navigationItems.map(item => (
                <Link key={item.href} href={item.href} className="block text-muted-foreground hover:text-foreground">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>hello@company.com</p>
              <p>+1 (555) 123-4567</p>
              <p>123 Business St, City</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
