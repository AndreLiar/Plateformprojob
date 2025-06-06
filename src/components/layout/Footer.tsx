export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border py-8 text-center text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} PlatformPro Jobs. All rights reserved.</p>
        <p className="text-sm mt-1">Connecting talent with opportunity in platform engineering.</p>
      </div>
    </footer>
  );
}
